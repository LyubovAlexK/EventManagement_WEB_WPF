using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventManagement.Data
{
    public class ApplicationContext : DbContext
    {
        public DbSet<Users> Users { get; set; } = null!;
        public DbSet<Event> Event { get; set; } = null!;
        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<Clients> Clients { get; set; } = null!;
        public DbSet<EventCategories> EventCategories { get; set; } = null!;
        public DbSet<Venues> Venues { get; set; } = null!;

        public ApplicationContext() { }

        public ApplicationContext(DbContextOptions<ApplicationContext> options) : base(options)
        {

        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Data Source=DESKTOP-3HK6G3K\\SQLEXPRESS;Initial Catalog=PlanningHoldingEvents_Kremlakova;Integrated Security=True;Trust Server Certificate=True");
            }
        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //Первичные ключи
            modelBuilder.Entity<Users>().HasKey(u => u.UserId);
            modelBuilder.Entity<Role>().HasKey(r => r.RoleId);
            modelBuilder.Entity<Clients>().HasKey(c => c.ClientId);
            modelBuilder.Entity<Event>().HasKey(e => e.EventId);
            modelBuilder.Entity<EventCategories>().HasKey(c => c.CategoryId);
            modelBuilder.Entity<Venues>().HasKey(v => v.VenueId);


            //User -> Role
            modelBuilder.Entity<Users>()
                .HasOne(r => r.Role)
                .WithMany(u => u.Users)
                .HasForeignKey(r => r.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            //Event -> User
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Users)
                .WithMany(u => u.Events)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            //Event->EventCategory
            modelBuilder.Entity<Event>()
                .HasOne(e => e.EventCategories)
                .WithMany(ec => ec.Events)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            //Event -> Venue
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Venues)
                .WithMany(v => v.Events)
                .HasForeignKey(e => e.VenueId)
                .OnDelete(DeleteBehavior.Restrict);

            //Clients -> Event
            modelBuilder.Entity<Clients>()
                .HasOne(e => e.Events)
                .WithMany(c => c.Clients)
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
