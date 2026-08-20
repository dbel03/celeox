using CeleoxApi.Data;
using CeleoxApi.Models;
using CeleoxApi.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using SkiaSharp;
using LibHeifSharp;

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
    [RequestSizeLimit(30 * 1024 * 1024)]
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
        "image/webp",
        "image/heic",
        "image/heif"
    };


        var originalContentType =
            file.ContentType.ToLowerInvariant();


        if (!allowedTypes.Contains(originalContentType))
        {
            return BadRequest(
                "Formato no permitido. Usa JPG, PNG, WEBP o HEIC."
            );
        }


        /*
         * Las imágenes HEIC/HEIF siempre se convierten
         * a JPEG antes de subirlas — no las mantenemos
         * en su formato original.
         */
        var isHeif =
            originalContentType == "image/heic" ||
            originalContentType == "image/heif";

        var outputContentType =
            isHeif ? "image/jpeg" : originalContentType;


        /*
         * Determinamos la extensión según el
         * formato de SALIDA, no el original.
         */
        var extension = outputContentType switch
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
         * antes de subirla. El decode usa el tipo
         * ORIGINAL (para saber si hay que pasar por
         * DecodeHeifToBitmap), el encode usa el
         * tipo de SALIDA.
         */
        await using var originalStream =
            file.OpenReadStream();

        using var optimizedStream =
            await OptimizeImageAsync(
                originalStream,
                originalContentType,
                outputContentType
            );

        //Subimos la imagen
        await _backblazeService.UploadAsync(
            optimizedStream,
            objectKey,
            outputContentType
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
        string originalContentType,
        string outputContentType)
    {
        var isHeif =
            originalContentType == "image/heic" ||
            originalContentType == "image/heif";

        using var originalBitmap = isHeif
            ? DecodeHeifToBitmap(inputStream)
            : SKBitmap.Decode(inputStream)
                ?? throw new InvalidOperationException(
                    "No se ha podido decodificar la imagen."
                );

        SKBitmap resizedBitmap = originalBitmap;

        if (originalBitmap.Width > MaxDimension ||
            originalBitmap.Height > MaxDimension)
        {
            var scale =
                (float)MaxDimension /
                Math.Max(
                    originalBitmap.Width,
                    originalBitmap.Height
                );

            var newWidth =
                (int)(originalBitmap.Width * scale);

            var newHeight =
                (int)(originalBitmap.Height * scale);

            resizedBitmap = originalBitmap.Resize(
                new SKImageInfo(newWidth, newHeight),
                new SKSamplingOptions(SKCubicResampler.Mitchell)
            ) ?? throw new InvalidOperationException(
                    "No se ha podido redimensionar la imagen."
                );
        }

        using var image =
            SKImage.FromBitmap(resizedBitmap);

        SKEncodedImageFormat format;
        int quality;

        switch (outputContentType)
        {
            case "image/jpeg":
                format = SKEncodedImageFormat.Jpeg;
                quality = JpegQuality;
                break;

            case "image/webp":
                format = SKEncodedImageFormat.Webp;
                quality = WebpQuality;
                break;

            case "image/png":
                format = SKEncodedImageFormat.Png;
                quality = 100;
                break;

            default:
                throw new NotSupportedException(
                    $"Formato no soportado: {outputContentType}"
                );
        }

        using var encodedData =
            image.Encode(format, quality);

        var outputStream = new MemoryStream();

        encodedData.SaveTo(outputStream);

        outputStream.Position = 0;

        if (!ReferenceEquals(
            resizedBitmap,
            originalBitmap))
        {
            resizedBitmap.Dispose();
        }

        return outputStream;
    }

    private SKBitmap DecodeHeifToBitmap(Stream inputStream)
    {
        using var memoryStream = new MemoryStream();
        inputStream.CopyTo(memoryStream);

        using var heifContext =
            new HeifContext(memoryStream.ToArray());

        using var primaryImageHandle =
            heifContext.GetPrimaryImageHandle();

        using var heifImage =
            primaryImageHandle.Decode(
                HeifColorspace.Rgb,
                HeifChroma.InterleavedRgba32
            );

        var width = heifImage.Width;
        var height = heifImage.Height;

        var planeData =
            heifImage.GetPlane(HeifChannel.Interleaved);

        var bitmap = new SKBitmap(
            new SKImageInfo(
                width,
                height,
                SKColorType.Rgba8888,
                SKAlphaType.Unpremul
            )
        );

        unsafe
        {
            byte* srcPtr = (byte*)planeData.Scan0;
            byte* dstPtr = (byte*)bitmap.GetPixels();

            for (int y = 0; y < height; y++)
            {
                Buffer.MemoryCopy(
                    srcPtr + y * planeData.Stride,
                    dstPtr + y * bitmap.RowBytes,
                    bitmap.RowBytes,
                    Math.Min(planeData.Stride, bitmap.RowBytes)
                );
            }
        }

        return bitmap;
    }
}