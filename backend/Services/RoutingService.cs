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

        // En desarrollo usamos el fichero del proyecto.
        // En producción usamos el almacenamiento temporal de Render.
        var localPath = environment.IsDevelopment()
            ? Path.Combine(
                environment.ContentRootPath,
                "Data",
                "routing",
                "cataluna.routerdb"
            )
            : Path.Combine(
                Path.GetTempPath(),
                "cataluna.routerdb"
            );

        RouterDb routerDb;

        // ============================================================
        // 1. DEVELOPMENT
        // ============================================================

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

            await fileStream.CopyToAsync(memoryStream);

            memoryStream.Position = 0;

            routerDb =
                RouterDb.Deserialize(memoryStream);
        }

        // ============================================================
        // 2. PRODUCTION
        // ============================================================

        else
        {
            // --------------------------------------------------------
            // 2.1. Comprobar si ya tenemos el RouterDb en el
            //      almacenamiento temporal de Render.
            // --------------------------------------------------------

            if (File.Exists(localPath))
            {
                Console.WriteLine(
                    $"Production: RouterDb encontrado localmente: {localPath}"
                );

                await using var fileStream =
                    File.OpenRead(localPath);

                using var memoryStream =
                    new MemoryStream();

                await fileStream.CopyToAsync(memoryStream);

                memoryStream.Position = 0;

                routerDb =
                    RouterDb.Deserialize(memoryStream);
            }

            // --------------------------------------------------------
            // 2.2. Si no existe localmente, descargarlo de B2.
            // --------------------------------------------------------

            else
            {
                Console.WriteLine(
                    "Production: RouterDb no encontrado localmente."
                );

                Console.WriteLine(
                    "Production: descargando RouterDb desde Backblaze B2..."
                );

                await using var s3Stream =
                    await backblaze.OpenReadAsync(
                        "routing/cataluna.routerdb"
                    );

                // Guardamos una copia temporal en Render.
                await using var fileStream =
                    File.Create(localPath);

                await s3Stream.CopyToAsync(fileStream);

                Console.WriteLine(
                    $"Production: RouterDb descargado y guardado en: {localPath}"
                );

                // ----------------------------------------------------
                // 2.3. Cargar el fichero desde el almacenamiento local
                //      y deserializarlo en memoria.
                // ----------------------------------------------------

                await using var localStream =
                    File.OpenRead(localPath);

                using var memoryStream =
                    new MemoryStream();

                await localStream.CopyToAsync(memoryStream);

                memoryStream.Position = 0;

                routerDb =
                    RouterDb.Deserialize(memoryStream);
            }
        }

        // ============================================================
        // 3. RouterDb cargado en memoria
        // ============================================================

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