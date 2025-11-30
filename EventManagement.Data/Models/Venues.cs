using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventManagement.Data
{
    public class Venues
    {
        public int VenueId { get; set; }
        public string VenueName { get; set; }
        public string Address { get; set; }
        public int Capacity { get; set; }
        public string? Description { get; set; }
        public List<Event> Events { get; set; } = new();
    }
}
