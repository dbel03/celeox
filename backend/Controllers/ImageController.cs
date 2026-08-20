using CeleoxApi.Data;
using CeleoxApi.Models;
using CeleoxApi.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Formats.Png;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/images")]
public class ImageController : ControllerBase
{
    private const int MaxDimension = 1920;
    private const int JpegQuality = 80;
    private const int WebpQuality = 80;

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
     * ============================================
     * SUBIR IMAGEN
     * ============================================
     *
     * POST /api/images/{featureId}
     *
     * Añade una nueva imagen a la MountainFeature.
     *
     * No elimina las imágenes anteriores.
     */
    [HttpPost("{featureId}")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(
        string featureId,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(
                "No se ha enviado ninguna imagen."
            );
        }


        /*
         * Buscamos la MountainFeature.
         */
        var feature = await _mongoDbContext.MountainFeatures
            .Find(x => x.Id == featureId)
            .FirstOrDefaultAsync();

        if (feature == null)
        {
            return NotFound(
                "La MountainFeature no existe."
            );
        }


        /*
         * Tipos de imagen permitidos.
         */
        var allowedTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };


        var contentType =
            file.ContentType.ToLowerInvariant();


        if (!allowedTypes.Contains(contentType))
        {
            return BadRequest(
                "Formato no permitido. Usa JPG, PNG o WEBP."
            );
        }


        /*
         * Determinamos la extensión.
         */
        var extension = contentType switch
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
         * Generamos un nombre único.
         */
        var uniqueFileName =
            $"{Guid.NewGuid():N}{extension}";


        /*
         * Ruta dentro de Backblaze B2.
         *
         * Cada MountainFeature tiene su propia carpeta.
         */
        var objectKey =
            $"mountain-features/{featureId}/{uniqueFileName}";


        /*
         * Guardamos el nombre original.
         */
        var originalFileName =
            Path.GetFileName(file.FileName);


        /*
         * Optimizamos la imagen (resize + recompresión)
         * antes de subirla.
         */
        await using var originalStream =
            file.OpenReadStream();

        using var optimizedStream =
            await OptimizeImageAsync(
                originalStream,
                contentType
            );

        //Subimos la imagen
        await _backblazeService.UploadAsync(
            optimizedStream,
            objectKey,
            contentType
        );

        /*
         * Creamos la referencia de la imagen.
         */
        var image = new MountainImage
        {
            Id = Guid.NewGuid().ToString("N"),
            ImageKey = objectKey,
            FileName = originalFileName
        };

        /*
         * Añadimos la imagen al array Images
         * de MongoDB.
         */
        var update =
            Builders<MountainFeature>
                .Update
                .Push(
                    x => x.Images,
                    image
                );


        await _mongoDbContext.MountainFeatures
            .UpdateOneAsync(
                x => x.Id == featureId,
                update
            );


        /*
         * Generamos una URL temporal inmediatamente.
         *
         * Esto permite que el frontend pueda mostrar
         * la imagen recién subida sin hacer otra petición.
         */
        var url =
            _backblazeService.GetTemporaryUrl(
                image.ImageKey,
                expirationMinutes: 60
            );


        return Ok(new
        {
            id = image.Id,
            url,
            fileName = image.FileName
        });
    }


    /*
     * ============================================
     * OBTENER IMÁGENES
     * ============================================
     *
     * GET /api/images/{featureId}
     *
     * Devuelve todas las imágenes de una feature
     * con URLs temporales de Backblaze B2.
     */
    [HttpGet("{featureId}")]
    public async Task<IActionResult> GetImages(
        string featureId)
    {
        var feature = await _mongoDbContext.MountainFeatures
            .Find(x => x.Id == featureId)
            .FirstOrDefaultAsync();


        if (feature == null)
        {
            return NotFound(
                "La MountainFeature no existe."
            );
        }


        /*
         * Si no tiene imágenes,
         * devolvemos un array vacío.
         *
         * Esto es mejor que devolver 404 porque
         * la feature sí existe.
         */
        if (feature.Images == null ||
            feature.Images.Count == 0)
        {
            return Ok(Array.Empty<object>());
        }


        /*
         * Generamos una URL temporal para cada imagen.
         */
        var images = feature.Images
            .Select(image => new
            {
                id = image.Id,

                url = _backblazeService.GetTemporaryUrl(
                    image.ImageKey,
                    expirationMinutes: 60
                ),

                fileName = image.FileName
            })
            .ToList();


        return Ok(images);
    }


    /*
     * ============================================
     * ELIMINAR UNA IMAGEN
     * ============================================
     *
     * DELETE /api/images/{featureId}/{imageId}
     *
     * Elimina únicamente la imagen indicada.
     */
    [HttpDelete("{featureId}/{imageId}")]
    public async Task<IActionResult> DeleteImage(
        string featureId,
        string imageId)
    {
        var feature = await _mongoDbContext.MountainFeatures
            .Find(x => x.Id == featureId)
            .FirstOrDefaultAsync();


        if (feature == null)
        {
            return NotFound(
                "La MountainFeature no existe."
            );
        }


        /*
         * Buscamos la imagen concreta.
         */
        var image = feature.Images?
            .FirstOrDefault(
                x => x.Id == imageId
            );


        if (image == null)
        {
            return NotFound(
                "La imagen no existe."
            );
        }


        /*
         * Primero eliminamos el objeto de B2.
         */
        await _backblazeService.DeleteAsync(
            image.ImageKey
        );


        /*
         * Después eliminamos la referencia
         * del array Images en MongoDB.
         */
        var update =
            Builders<MountainFeature>
                .Update
                .PullFilter(
                    x => x.Images,
                    x => x.Id == imageId
                );


        await _mongoDbContext.MountainFeatures
            .UpdateOneAsync(
                x => x.Id == featureId,
                update
            );


        return NoContent();
    }

    /*
    * Redimensiona si excede MaxDimension y
    * recomprime con la calidad objetivo.
    *
    * Devuelve un nuevo stream ya optimizado,
    * listo para subir a B2.
    */
    private async Task<MemoryStream> OptimizeImageAsync(
        Stream inputStream,
        string contentType)
    {
        using var image =
            await Image.LoadAsync(inputStream);

        /*
         * Redimensionamos solo si supera el máximo,
         * nunca ampliamos imágenes pequeñas.
         */
        if (image.Width > MaxDimension ||
            image.Height > MaxDimension)
        {
            image.Mutate(x => x.Resize(
                new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(MaxDimension, MaxDimension)
                }
            ));
        }

        var outputStream = new MemoryStream();

        switch (contentType)
        {
            case "image/jpeg":
                await image.SaveAsync(
                    outputStream,
                    new JpegEncoder { Quality = JpegQuality }
                );
                break;

            case "image/webp":
                await image.SaveAsync(
                    outputStream,
                    new WebpEncoder { Quality = WebpQuality }
                );
                break;

            case "image/png":
                /*
                 * PNG es sin pérdida; no aplica "calidad"
                 * como JPEG/WEBP. Solo aprovechamos el
                 * redimensionado si hizo falta.
                 */
                await image.SaveAsync(
                    outputStream,
                    new PngEncoder()
                );
                break;

            default:
                throw new NotSupportedException(
                    $"Formato no soportado: {contentType}"
                );
        }

        outputStream.Position = 0;

        return outputStream;
    }
}