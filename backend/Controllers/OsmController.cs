using CeleoxApi.Models;
using CeleoxApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/osm")]
public class OsmController(
    OsmService osmService,
    MountainFeatureService featureService) : ControllerBase
{
    private readonly OsmService _osmService = osmService;
    private readonly MountainFeatureService _featureService = featureService;


    /*
     * =========================================================
     * TIPOS SOPORTADOS
     * =========================================================
     */

    private IEnumerable<string> SupportedTypes =>
        _osmService.GetSupportedTypes();

    /*
     * =========================================================
     * INFORMACIÓN OSM
     * =========================================================
     */

    [HttpGet("info")]
    public IActionResult GetInfo()
    {
        var info = _osmService.GetInfo();

        return Ok(info);
    }


    /*
     * =========================================================
     * INFORMACIÓN MONTAÑA
     * =========================================================
     */

    [HttpGet("mountain")]
    public IActionResult GetMountainInfo()
    {
        var info = _osmService.GetMountainInfo();

        return Ok(info);
    }


    /*
     * =========================================================
     * IMPORTAR FEATURES OSM -> MONGO
     * =========================================================
     */

    [HttpPost("import")]
    public async Task<IActionResult> ImportFeatures()
    {
        var counts = new Dictionary<string, int>();

        foreach (var type in SupportedTypes)
        {
            var features =
                _osmService.GetFeaturesByType(type);

            await _featureService.UpsertMountainFeaturesAsync(
                features
            );

            counts[type] = features.Count;
        }

        return Ok(new
        {
            total = counts.Values.Sum(),
            byType = counts
        });
    }


    /*
     * =========================================================
     * FEATURES POR TIPO Y BOUNDING BOX
     * =========================================================
     */

    [HttpGet("features")]
    public async Task<IActionResult> GetFeatures(
        [FromQuery] string type,
        [FromQuery] double minLat,
        [FromQuery] double maxLat,
        [FromQuery] double minLon,
        [FromQuery] double maxLon)
    {
        if (
            string.IsNullOrWhiteSpace(type) ||
            !SupportedTypes.Contains(type)
        )
        {
            return BadRequest(
                $"Tipo no soportado. Tipos válidos: " +
                $"{string.Join(", ", SupportedTypes)}"
            );
        }

        var features =
            await _featureService.GetFeaturesInBoundsAsync(
                type,
                minLat,
                maxLat,
                minLon,
                maxLon
            );

        return Ok(features);
    }


    /*
     * =========================================================
     * BUSCAR FEATURES POR NOMBRE
     * =========================================================
     */

    [HttpGet("features/search")]
    public async Task<IActionResult> SearchFeatures(
        [FromQuery] string name,
        [FromQuery] string? type = null)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return Ok(new List<MountainFeature>());
        }

        if (
            !string.IsNullOrWhiteSpace(type) &&
            !SupportedTypes.Contains(type)
        )
        {
            return BadRequest(
                $"Tipo no soportado. Tipos válidos: " +
                $"{string.Join(", ", SupportedTypes)}"
            );
        }

        var features =
            await _featureService.SearchFeaturesAsync(
                name,
                type
            );

        return Ok(features);
    }
}