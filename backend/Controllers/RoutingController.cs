using CeleoxApi.Models.Routing;
using CeleoxApi.Services;
using Itinero;
using Itinero.Osm.Vehicles;
using Microsoft.AspNetCore.Mvc;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/routing")]
public class RoutingController(
    RoutingService routingService) : ControllerBase
{
    private readonly RoutingService _routingService = routingService;

    [HttpPost("calculate")]
    public IActionResult Calculate(
        [FromBody] RouteCalculationRequest request)
    {
        if (!_routingService.IsReady)
            return StatusCode(503, "El servicio de rutas no está disponible temporalmente.");

        Console.WriteLine(
                $"[ROUTING START] {DateTime.Now:HH:mm:ss.fff} " +
                $"Thread={Environment.CurrentManagedThreadId}"
            );

        Router router;

        try
        {
            router = _routingService.GetRouter();
        }
        catch (InvalidOperationException)
        {
            return StatusCode(503, "El servicio de rutas no está disponible temporalmente.");
        }

        var profile = Vehicle.Pedestrian.Fastest();

        var sourceResult = router.TryResolve(
            profile,
            (float)request.From.Latitude,
            (float)request.From.Longitude, 500);

        var targetResult = router.TryResolve(
            profile,
            (float)request.To.Latitude,
            (float)request.To.Longitude, 500);

        Console.WriteLine("======================================");
        Console.WriteLine($"From: {request.From.Latitude}, {request.From.Longitude} -> IsError={sourceResult.IsError} ErrorMessage={sourceResult.ErrorMessage}");
        Console.WriteLine($"To:   {request.To.Latitude}, {request.To.Longitude} -> IsError={targetResult.IsError} ErrorMessage={targetResult.ErrorMessage}");
        Console.WriteLine("======================================");

        if (sourceResult.IsError || targetResult.IsError)
        {
            return BadRequest(
                "No se ha podido resolver alguno de los puntos sobre la red de caminos.");
        }

        var routeResult = router.TryCalculate(
            profile,
            sourceResult.Value,
            targetResult.Value);

        if (routeResult.IsError)
        {
            return BadRequest(
                "No se ha podido calcular una ruta entre esos dos puntos.");
        }

        var route = routeResult.Value;

        var shape = route.Shape
            .Select(c => new RoutePointDto(c.Latitude, c.Longitude))
            .ToList();

        Console.WriteLine(
            $"[ROUTING END] {DateTime.Now:HH:mm:ss.fff} " +
            $"Thread={Environment.CurrentManagedThreadId}"
        );

        Console.WriteLine(
            $"[ROUTING] From={request.From.Latitude},{request.From.Longitude} " +
            $"To={request.To.Latitude},{request.To.Longitude}"
        );

        return Ok(new RouteCalculationResult(
            shape,
            route.TotalDistance,
            route.TotalTime));
    }

}