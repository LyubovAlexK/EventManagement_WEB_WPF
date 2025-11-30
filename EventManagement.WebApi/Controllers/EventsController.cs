using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EventManagement.Data;

namespace EventManagement.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly ApplicationContext _context;

    public EventsController(ApplicationContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventDto>>> GetEvents()
    {
        var events = await _context.Event
            .Include(e => e.EventCategories)
            .Include(e => e.Venues)
            .Include(e => e.Users)
            .Include(e => e.Clients)
            .Select(e => new EventDto
            {
                EventId = e.EventId,
                EventName = e.EventName,
                Description = e.Description,
                DateTimeStart = e.DateTimeStart,
                DateTimeFinish = e.DateTimeFinish,
                CategoryId = e.CategoryId,
                CategoryName = e.EventCategories.CategoryName,
                VenueId = e.VenueId,
                VenueName = e.Venues.VenueName,
                UserId = e.UserId,
                UserName = $"{e.Users.LastName} {e.Users.Name}",
                Status = e.Status,
                EstimatedBudget = e.EstimatedBudget,
                ActualBudget = e.ActualBudget,
                MaxNumOfGuests = e.MaxNumOfGuests,
                ClientCount = e.Clients.Count
            })
            .ToListAsync();

        return events;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EventDto>> GetEvent(int id)
    {
        var eventItem = await _context.Event
            .Include(e => e.EventCategories)
            .Include(e => e.Venues)
            .Include(e => e.Users)
            .Include(e => e.Clients)
            .Where(e => e.EventId == id)
            .Select(e => new EventDto
            {
                EventId = e.EventId,
                EventName = e.EventName,
                Description = e.Description,
                DateTimeStart = e.DateTimeStart,
                DateTimeFinish = e.DateTimeFinish,
                CategoryId = e.CategoryId,
                CategoryName = e.EventCategories.CategoryName,
                VenueId = e.VenueId,
                VenueName = e.Venues.VenueName,
                UserId = e.UserId,
                UserName = $"{e.Users.LastName} {e.Users.Name}",
                Status = e.Status,
                EstimatedBudget = e.EstimatedBudget,
                ActualBudget = e.ActualBudget,
                MaxNumOfGuests = e.MaxNumOfGuests,
                ClientCount = e.Clients.Count
            })
            .FirstOrDefaultAsync();

        if (eventItem == null)
            return NotFound();

        return eventItem;
    }

    [HttpPost]
    public async Task<ActionResult<Event>> PostEvent(Event eventItem)
    {
        _context.Event.Add(eventItem);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetEvent", new { id = eventItem.EventId }, eventItem);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutEvent(int id, Event eventItem)
    {
        if (id != eventItem.EventId)
            return BadRequest();

        _context.Entry(eventItem).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!EventExists(id))
                return NotFound();
            else
                throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var eventItem = await _context.Event.FindAsync(id);
        if (eventItem == null)
            return NotFound();

        _context.Event.Remove(eventItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool EventExists(int id)
    {
        return _context.Event.Any(e => e.EventId == id);
    }
}

public class EventDto
{
    public int EventId { get; set; }
    public string EventName { get; set; }
    public string Description { get; set; }
    public DateTime DateTimeStart { get; set; }
    public DateTime DateTimeFinish { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public int VenueId { get; set; }
    public string VenueName { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; }
    public string Status { get; set; }
    public decimal? EstimatedBudget { get; set; }
    public decimal? ActualBudget { get; set; }
    public int? MaxNumOfGuests { get; set; }
    public int ClientCount { get; set; }
}