using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EventManagement.Data;

namespace EventManagement.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VenuesController : ControllerBase
{
    private readonly ApplicationContext _context;

    public VenuesController(ApplicationContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Venues>>> GetVenues()
    {
        return await _context.Venues.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Venues>> GetVenue(int id)
    {
        var venue = await _context.Venues.FindAsync(id);
        if (venue == null)
            return NotFound();

        return venue;
    }

    [HttpPost]
    public async Task<ActionResult<Venues>> PostVenue(Venues venue)
    {
        _context.Venues.Add(venue);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetVenue", new { id = venue.VenueId }, venue);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutVenue(int id, Venues venue)
    {
        if (id != venue.VenueId)
            return BadRequest();

        _context.Entry(venue).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!VenueExists(id))
                return NotFound();
            else
                throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVenue(int id)
    {
        var venue = await _context.Venues.FindAsync(id);
        if (venue == null)
            return NotFound();

        // Проверка на связанные события
        var hasEvents = await _context.Event.AnyAsync(e => e.VenueId == id);
        if (hasEvents)
            return BadRequest(new { message = "Невозможно удалить место проведения, так как с ним связаны события" });

        _context.Venues.Remove(venue);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool VenueExists(int id)
    {
        return _context.Venues.Any(e => e.VenueId == id);
    }
}