using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventManagement.Data
{
    public class Event
    {
        public int EventId { get; set; }
        public string EventName { get; set; }
        public string? Description { get; set; }
        public DateTime DateTimeStart { get; set; }
        public DateTime DateTimeFinish { get; set; }
        public int CategoryId { get; set; }
        public int VenueId { get; set; }
        public int UserId { get; set; }
        public string? Status { get; set; }
        public decimal? EstimatedBudget { get; set; }
        public decimal? ActualBudget { get; set; }
        public int? MaxNumOfGuests { get; set; }
        public Users? Users { get; set; }
        public  EventCategories? EventCategories { get; set; }
        public Venues? Venues { get; set; }
        public List<Clients> Clients { get; set; } = new();
    }
}
