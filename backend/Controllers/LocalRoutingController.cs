using CeleoxApi.Services;
using Itinero;
using Itinero.IO.Osm;
using Itinero.Osm.Vehicles;
using Microsoft.AspNetCore.Mvc;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/local/routing")]
public class LocalRoutingController(
    BackblazeService backblazeService,
    IWebHostEnvironment environment) : ControllerBase
{
    private readonly BackblazeService _backblazeService =
        backblazeService;

    private readonly IWebHostEnvironment _environment =
        environment;

    [HttpPost("build")]
    public async Task<IActionResult> Build()
    {
        // Este endpoint solo debe existir en Development.
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        var contentRoot = _environment.ContentRootPath;

        var osmPath = Path.Combine(
            contentRoot,
            "Data",
            "osm",
            "cataluna-260816.osm.pbf");

        var routingDirectory = Path.Combine(
            contentRoot,
            "Data",
            "routing");

        var routerDbPath = Path.Combine(
            routingDirectory,
            "cataluna.routerdb");

        const string b2ObjectKey =
            "routing/cataluna.routerdb";

        if (!System.IO.File.Exists(osmPath))
        {
            return NotFound(
                $"No existe el fichero OSM: {osmPath}");
        }

        Directory.CreateDirectory(routingDirectory);

        Console.WriteLine("======================================");
        Console.WriteLine("GENERANDO ROUTERDB");
        Console.WriteLine($"OSM: {osmPath}");
        Console.WriteLine($"RouterDb: {routerDbPath}");
        Console.WriteLine("======================================");

        var start = DateTime.UtcNow;

        // Crear RouterDb vacío.
        var routerDb = new RouterDb();

        // Leer el PBF y construir la red para peatones.
        await using (var osmStream = System.IO.File.OpenRead(osmPath))
        {
            routerDb.LoadOsmData(
                osmStream,
                Vehicle.Pedestrian);
        }

        Console.WriteLine("OSM procesado.");
        
        // Guardar RouterDb localmente.
        await using (var routerDbStream =
            System.IO.File.Create(routerDbPath))
        {
            routerDb.Serialize(routerDbStream);
        }

        var fileInfo = new FileInfo(routerDbPath);

        Console.WriteLine(
            $"RouterDb generado: {fileInfo.Length / 1024d / 1024d:F2} MB");

        // Subir el mismo fichero a Backblaze B2.
        await using (var uploadStream =
            System.IO.File.OpenRead(routerDbPath))
        {
            await _backblazeService.UploadAsync(
                uploadStream,
                b2ObjectKey,
                "application/octet-stream");
        }

        var elapsed = DateTime.UtcNow - start;

        Console.WriteLine("RouterDb subido a Backblaze B2.");
        Console.WriteLine(
            $"Tiempo total: {elapsed.TotalSeconds:F2}s");
        Console.WriteLine("======================================");

        return Ok(new
        {
            osmFile = osmPath,
            routerDbFile = routerDbPath,
            backblazeKey = b2ObjectKey,
            sizeMb = Math.Round(
                fileInfo.Length / 1024d / 1024d,
                2),
            elapsedSeconds = Math.Round(
                elapsed.TotalSeconds,
                2)
        });
    }
}