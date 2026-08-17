using CeleoxApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/osm")]
public class OsmController : ControllerBase
{
    private readonly OsmService _osmService;

    public OsmController(OsmService osmService)
    {
        _osmService = osmService;
    }

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
}