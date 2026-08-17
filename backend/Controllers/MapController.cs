using Microsoft.AspNetCore.Mvc;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MapController : ControllerBase
{
    [HttpGet]
    public IActionResult GetMap()
    {
        return Ok(new
        {
            latitude = 41.3874,
            longitude = 2.1686,
            zoom = 13
        });
    }
}