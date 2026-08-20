using CeleoxApi.Data;
using CeleoxApi.Models;
using CeleoxApi.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/images")]
public class ImageController : ControllerBase
{
    private readonly MongoDbContext _mongoDbContext;
    private readonly BackblazeService _backblazeService;

    public ImageController(
        MongoDbContext mongoDbContext,
        BackblazeService backblazeService)
    {
        _mongoDbContext = mongoDbContext;
        _backblazeService = backblazeService;
    }

    /*
     * Sube una imagen para una MountainFeature.
     *
     * POST /api/images/{id}
     *
     * La imagen se guarda en Backblaze B2 y se almacena
     * en MongoDB la referencia al objeto y el nombre original.
     */
    [HttpPost("{id}")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(
        string id,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(
                "No se ha enviado ninguna imagen."
            );
        }

        var feature = await _mongoDbContext.MountainFeatures
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();

        if (feature == null)
        {
            return NotFound(
                "La MountainFeature no existe."
            );
        }

        var allowedTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        if (!allowedTypes.Contains(
            file.ContentType.ToLowerInvariant()))
        {
            return BadRequest(
                "Formato no permitido. Usa JPG, PNG o WEBP."
            );
        }

        var extension = file.ContentType.ToLowerInvariant() switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => null
        };

        if (extension == null)
        {
            return BadRequest(
                "No se ha podido determinar la extensión de la imagen."
            );
        }

        /*
         * Generamos un nombre único para B2.
         *
         * No utilizamos directamente el nombre original
         * para evitar colisiones entre archivos.
         */
        var uniqueFileName =
            $"{Guid.NewGuid():N}{extension}";

        var objectKey =
            $"mountain-features/{id}/{uniqueFileName}";

        /*
         * Guardamos el nombre original solamente como
         * información en MongoDB.
         */
        var originalFileName =
            Path.GetFileName(file.FileName);

        /*
         * Subimos la imagen a Backblaze B2.
         */
        await using var stream = file.OpenReadStream();

        await _backblazeService.UploadAsync(
            stream,
            objectKey,
            file.ContentType
        );

        /*
         * Si la feature ya tenía una imagen,
         * eliminamos la anterior de Backblaze.
         */
        if (!string.IsNullOrWhiteSpace(feature.ImageKey))
        {
            await _backblazeService.DeleteAsync(
                feature.ImageKey
            );
        }

        /*
         * Actualizamos MongoDB.
         */
        var update = Builders<MountainFeature>
            .Update
            .Set(x => x.ImageKey, objectKey)
            .Set(x => x.ImageFileName, originalFileName);

        await _mongoDbContext.MountainFeatures.UpdateOneAsync(
            x => x.Id == id,
            update
        );

        return Ok(new
        {
            imageKey = objectKey,
            imageFileName = originalFileName
        });
    }


    /*
     * Obtiene una URL temporal para visualizar la imagen.
     *
     * GET /api/images/{id}
     */
    [HttpGet("{id}")]
    public async Task<IActionResult> GetImage(
        string id)
    {
        var feature = await _mongoDbContext.MountainFeatures
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();

        if (feature == null)
        {
            return NotFound(
                "La MountainFeature no existe."
            );
        }

        if (string.IsNullOrWhiteSpace(feature.ImageKey))
        {
            return NotFound(
                "La MountainFeature no tiene ninguna imagen."
            );
        }

        /*
         * Generamos una URL temporal.
         *
         * El bucket de B2 continúa siendo privado.
         */
        var url = _backblazeService.GetTemporaryUrl(
            feature.ImageKey,
            expirationMinutes: 60
        );

        return Ok(new
        {
            url,
            fileName = feature.ImageFileName
        });
    }


    /*
     * Elimina la imagen de una MountainFeature.
     *
     * DELETE /api/images/{id}
     */
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteImage(
        string id)
    {
        var feature = await _mongoDbContext.MountainFeatures
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();

        if (feature == null)
        {
            return NotFound(
                "La MountainFeature no existe."
            );
        }

        /*
         * Si no tiene imagen, no hay nada que borrar.
         */
        if (string.IsNullOrWhiteSpace(feature.ImageKey))
        {
            return NoContent();
        }

        /*
         * Eliminamos la imagen de Backblaze.
         */
        await _backblazeService.DeleteAsync(
            feature.ImageKey
        );

        /*
         * Eliminamos la referencia de MongoDB.
         */
        var update = Builders<MountainFeature>
            .Update
            .Set(x => x.ImageKey, null)
            .Set(x => x.ImageFileName, null);

        await _mongoDbContext.MountainFeatures.UpdateOneAsync(
            x => x.Id == id,
            update
        );

        return NoContent();
    }
}