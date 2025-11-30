using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventManagement.Data
{
    public class Clients
    {
        public int ClientId { get; set; }
        public int EventId { get; set; }
        public string LastName { get; set; }
        public string Name { get; set; }
        public string? MiddleName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public Event? Events { get; set; }
    }
}
