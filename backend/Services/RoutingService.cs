using Itinero;

namespace CeleoxApi.Services;

public class RoutingService
{
    private readonly RouterDb _routerDb;

    private RoutingService(RouterDb routerDb)
    {
        _routerDb = routerDb;
    }

    public static async Task<RoutingService> CreateAsync(
        BackblazeService backblaze,
        IWebHostEnvironment environment)
    {
        Console.WriteLine("======================================");

        var start = DateTime.UtcNow;

        RouterDb routerDb;

        var localPath = Path.Combine(
            environment.ContentRootPath,
            "Data",
            "routing",
            "cataluna.routerdb"
        );

        if (environment.IsDevelopment())
        {
            Console.WriteLine(
                $"Development: cargando RouterDb local: {localPath}"
            );

            if (!File.Exists(localPath))
            {
                throw new FileNotFoundException(
                    "No se encontró el RouterDb local.",
                    localPath
                );
            }

            await using var fileStream =
                File.OpenRead(localPath);

            using var memoryStream =
                new MemoryStream();

            await fileStream.CopyToAsync(
                memoryStream
            );

            memoryStream.Position = 0;

            routerDb =
                RouterDb.Deserialize(
                    memoryStream
                );
        }
        else
        {
            Console.WriteLine(
                "Production: cargando RouterDb desde Backblaze B2..."
            );

            await using var s3Stream =
                await backblaze.OpenReadAsync(
                    "routing/cataluna.routerdb"
                );

            using var memoryStream =
                new MemoryStream();

            await s3Stream.CopyToAsync(
                memoryStream
            );

            memoryStream.Position = 0;

            routerDb =
                RouterDb.Deserialize(
                    memoryStream
                );
        }

        var elapsed =
            DateTime.UtcNow - start;

        Console.WriteLine(
            $"RouterDb cargado en memoria en {elapsed.TotalSeconds:F2}s"
        );

        Console.WriteLine("======================================");

        return new RoutingService(routerDb);
    }

    public Router CreateRouter()
    {
        return new Router(_routerDb);
    }
}