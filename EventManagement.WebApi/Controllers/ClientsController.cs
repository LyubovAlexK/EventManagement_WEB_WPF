using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EventManagement.Data;

namespace EventManagement.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly ApplicationContext _context;

    public ClientsController(ApplicationContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClientDto>>> GetClients()
    {
        var clients = await _context.Clients
            .Include(c => c.Events)
            .Select(c => new ClientDto
            {
                ClientId = c.ClientId,
                EventId = c.EventId,
                EventName = c.Events.EventName,
                LastName = c.LastName,
                Name = c.Name,
                MiddleName = c.MiddleName,
                Email = c.Email,
                Phone = c.Phone
            })
            .ToListAsync();

        return clients;
    }

    [HttpGet("by-event/{eventId}")]
    public async Task<ActionResult<IEnumerable<Clients>>> GetClientsByEvent(int eventId)
    {
        return await _context.Clients
            .Where(c => c.EventId == eventId)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Clients>> PostClient(Clients client)
    {
        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetClients", new { id = client.ClientId }, client);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutClient(int id, Clients client)
    {
        if (id != client.ClientId)
            return BadRequest();

        _context.Entry(client).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ClientExists(id))
                return NotFound();
            else
                throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClient(int id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null)
            return NotFound();

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ClientExists(int id)
    {
        return _context.Clients.Any(e => e.ClientId == id);
    }
}

public class ClientDto
{
    public int ClientId { get; set; }
    public int EventId { get; set; }
    public string EventName { get; set; }
    public string LastName { get; set; }
    public string Name { get; set; }
    public string MiddleName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
}