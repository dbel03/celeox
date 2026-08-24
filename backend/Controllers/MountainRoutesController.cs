using CeleoxApi.Models;
using CeleoxApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MountainRoutesController(
    MountainRouteService service,
    MountainFeatureService featureService) : ControllerBase
{
    private readonly MountainRouteService _service = service;
    private readonly MountainFeatureService _featureService = featureService;

    [HttpGet]
    public async Task<ActionResult<List<MountainRoute>>> GetAll()
    {
        var routes = await _service.GetAllAsync();

        return Ok(routes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MountainRoute>> GetById(
        string id)
    {
        var route = await _service.GetByIdAsync(id);

        if (route == null)
            return NotFound();

        return Ok(route);
    }

    [HttpPost]
    public async Task<ActionResult<MountainRoute>> Create(
        [FromBody] MountainRoute route)
    {
        try
        {
            var createdRoute =
                await _service.CreateAsync(route);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdRoute.Id },
                createdRoute
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] MountainRoute route)
    {
        try
        {
            var updated =
                await _service.UpdateAsync(id, route);

            if (!updated)
                return NotFound();

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(
        string id)
    {
        var deleted =
            await _service.DeleteAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }

    [HttpPost("FeaturesAlongTrack")]
    public async Task<ActionResult<List<MountainFeature>>> FeaturesAlongTrack(
    [FromBody] List<RoutePoint> track)
    {
        try
        {
            var features =
                await _featureService.GetFeaturesAlongTrackAsync(
                    track
                );

            return Ok(features);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
}