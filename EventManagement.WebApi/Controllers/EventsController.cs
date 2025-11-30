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
        try
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

            Console.WriteLine($"Loaded {events.Count} events from database");

            if (events.Any())
            {
                Console.WriteLine("First event sample:");
                Console.WriteLine($"ID: {events[0].EventId}, Name: {events[0].EventName}, User: {events[0].UserName}");
            }

            return events;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading events: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке мероприятий", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EventDto>> GetEvent(int id)
    {
        try
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
            {
                Console.WriteLine($"Event with id {id} not found");
                return NotFound();
            }

            return eventItem;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading event {id}: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке мероприятия", error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<Event>> PostEvent(Event eventItem)
    {
        try
        {
            _context.Event.Add(eventItem);
            await _context.SaveChangesAsync();

            Console.WriteLine($"Created new event: {eventItem.EventName} with ID: {eventItem.EventId}");
            return CreatedAtAction("GetEvent", new { id = eventItem.EventId }, eventItem);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating event: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при создании мероприятия", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutEvent(int id, Event eventItem)
    {
        if (id != eventItem.EventId)
        {
            Console.WriteLine($"ID mismatch: {id} != {eventItem.EventId}");
            return BadRequest();
        }

        try
        {
            _context.Entry(eventItem).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            Console.WriteLine($"Updated event: {eventItem.EventName} with ID: {eventItem.EventId}");
            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!EventExists(id))
            {
                Console.WriteLine($"Event with id {id} not found for update");
                return NotFound();
            }
            else
            {
                throw;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating event {id}: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при обновлении мероприятия", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        try
        {
            var eventItem = await _context.Event.FindAsync(id);
            if (eventItem == null)
            {
                Console.WriteLine($"Event with id {id} not found for deletion");
                return NotFound();
            }

            _context.Event.Remove(eventItem);
            await _context.SaveChangesAsync();

            Console.WriteLine($"Deleted event with ID: {id}");
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting event {id}: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при удалении мероприятия", error = ex.Message });
        }
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