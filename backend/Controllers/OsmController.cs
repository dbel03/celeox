using CeleoxApi.Data;
using CeleoxApi.Models;
using CeleoxApi.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/osm")]
public class OsmController : ControllerBase
{
    private readonly OsmService _osmService;
    private readonly MongoDbContext _mongoDbContext;

    public OsmController(
        OsmService osmService,
        MongoDbContext mongoDbContext)
    {
        _osmService = osmService;
        _mongoDbContext = mongoDbContext;
    }

    /*
     * Tipos de feature soportados, delegado a OsmService
     * (que es quien conoce el mapeo real tag -> type).
     * Evita mantener dos listas duplicadas y desincronizadas.
     */
    private IEnumerable<string> SupportedTypes =>
        _osmService.GetSupportedTypes();

    [HttpGet("info")]
    public IActionResult GetInfo()
    {
        var info = _osmService.GetInfo();

        return Ok(info);
    }

    [HttpGet("mountain")]
    public IActionResult GetMountainInfo()
    {
        var info = _osmService.GetMountainInfo();

        return Ok(info);
    }

    /*
     * Importa todos los tipos soportados desde el extracto OSM
     * y los guarda (upsert) en Mongo.
     */
    [HttpPost("import")]
    public async Task<IActionResult> ImportFeatures()
    {
        var counts = new Dictionary<string, int>();

        foreach (var type in SupportedTypes)
        {
            var features = _osmService.GetFeaturesByType(type);

            await _mongoDbContext.UpsertMountainFeaturesAsync(features);

            counts[type] = features.Count;
        }

        return Ok(new
        {
            total = counts.Values.Sum(),
            byType = counts
        });
    }

    /*
     * Devuelve features de un tipo concreto dentro de un área.
     * type es obligatorio: spring, peak, cave, hospital, etc.
     */
    [HttpGet("features")]
    public async Task<IActionResult> GetFeatures(
        [FromQuery] string type,
        [FromQuery] double minLat,
        [FromQuery] double maxLat,
        [FromQuery] double minLon,
        [FromQuery] double maxLon)
    {
        if (string.IsNullOrWhiteSpace(type) || !SupportedTypes.Contains(type))
        {
            return BadRequest(
                $"Tipo no soportado. Tipos válidos: {string.Join(", ", SupportedTypes)}"
            );
        }

        var filter =
            Builders<MountainFeature>.Filter.Eq(x => x.Type, type)
            &
            Builders<MountainFeature>.Filter.Gte(x => x.Latitude, minLat)
            &
            Builders<MountainFeature>.Filter.Lte(x => x.Latitude, maxLat)
            &
            Builders<MountainFeature>.Filter.Gte(x => x.Longitude, minLon)
            &
            Builders<MountainFeature>.Filter.Lte(x => x.Longitude, maxLon);

        var features = await _mongoDbContext.MountainFeatures
            .Find(filter)
            .ToListAsync();

        return Ok(features);
    }

    /*
     * Busca features de un tipo concreto (o de todos, si se omite type)
     * por nombre.
     */
    [HttpGet("features/search")]
    public async Task<IActionResult> SearchFeatures(
        [FromQuery] string name,
        [FromQuery] string? type = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Ok(new List<MountainFeature>());

        var nameFilter = Builders<MountainFeature>.Filter.Regex(
            x => x.Name,
            new MongoDB.Bson.BsonRegularExpression(name, "i")
        );

        var filter = nameFilter;

        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!SupportedTypes.Contains(type))
            {
                return BadRequest(
                    $"Tipo no soportado. Tipos válidos: {string.Join(", ", SupportedTypes)}"
                );
            }

            filter &= Builders<MountainFeature>.Filter.Eq(x => x.Type, type);
        }

        var features = await _mongoDbContext.MountainFeatures
            .Find(filter)
            .Limit(20)
            .ToListAsync();

        return Ok(features);
    }
}