using CeleoxApi.Services;
using Itinero;
using Itinero.IO.Osm;
using Itinero.Osm.Vehicles;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/local/routing")]
public class LocalRoutingController(
        IWebHostEnvironment environment) : ControllerBase
{
    private readonly IWebHostEnvironment _environment =
        environment;

    private const string RouterDbFileName = "cataluna.routerdb";
    private const string RouterDbZipFileName = "routerdb.zip";

    [HttpPost("build")]
    public async Task<IActionResult> Build()
    {
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
            RouterDbFileName);

        var zipPath = Path.Combine(
            routingDirectory,
            RouterDbZipFileName);

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

        var routerDb = new RouterDb();

        await using (var osmStream = System.IO.File.OpenRead(osmPath))
        {
            routerDb.LoadOsmData(
                osmStream,
                Vehicle.Pedestrian);
        }

        Console.WriteLine("OSM procesado.");

        routerDb.Compress();

        Console.WriteLine("RouterDb comprimido y ordenado.");

        await using (var routerDbStream =
            System.IO.File.Create(routerDbPath))
        {
            routerDb.Serialize(routerDbStream);
        }

        var fileInfo = new FileInfo(routerDbPath);

        Console.WriteLine(
            $"RouterDb generado: {fileInfo.Length / 1024d / 1024d:F2} MB");

        if (System.IO.File.Exists(zipPath))
        {
            System.IO.File.Delete(zipPath);
        }

        using (var archive = ZipFile.Open(zipPath, ZipArchiveMode.Create))
        {
            archive.CreateEntryFromFile(routerDbPath, RouterDbFileName);
        }

        var zipInfo = new FileInfo(zipPath);

        Console.WriteLine(
            $"ZIP generado: {zipPath} ({zipInfo.Length / 1024d / 1024d:F2} MB)");

        var elapsed = DateTime.UtcNow - start;

        Console.WriteLine(
            $"Tiempo total: {elapsed.TotalSeconds:F2}s");
        Console.WriteLine("======================================");

        return Ok(new
        {
            osmFile = osmPath,
            routerDbFile = routerDbPath,
            zipFile = zipPath,
            sizeMb = Math.Round(
                fileInfo.Length / 1024d / 1024d,
                2),
            zipSizeMb = Math.Round(
                zipInfo.Length / 1024d / 1024d,
                2),
            elapsedSeconds = Math.Round(
                elapsed.TotalSeconds,
                2)
        });
    }
}