import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Calendar, MapPin } from 'lucide-react';
import './App.css';

interface CalendarEvent {
  title: string;
  date: string;
  description: string;
  icon: string;
  category: string;
}

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const response = await fetch('./calendar-data.json');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      seasonal: 'bg-green-100 text-green-800 border-green-200',
      environmental: 'bg-blue-100 text-blue-800 border-blue-200',
      celebration: 'bg-purple-100 text-purple-800 border-purple-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || colors.default;
  };

  const handleDownloadICS = () => {
    const link = document.createElement('a');
    link.href = './MaybeSomethingSeasonal.ics';
    link.download = 'MaybeSomethingSeasonal.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading seasonal calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Maybe Something Seasonal
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            A calendar celebrating nature's cycles and seasonal moments
          </p>
          <button
            onClick={handleDownloadICS}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Calendar (.ics)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map(day => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[80px] p-2 border rounded-lg ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      } ${isToday ? 'ring-2 ring-green-500' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                      } ${isToday ? 'text-green-600' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event, index) => (
                          <div
                            key={index}
                            onClick={() => setSelectedEvent(event)}
                            className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-all ${getCategoryColor(event.category)}`}
                          >
                            <span className="mr-1">{event.icon}</span>
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Event Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Event Details
              </h3>
              {selectedEvent ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{selectedEvent.icon}</div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {selectedEvent.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(selectedEvent.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedEvent.category)}`}>
                    {selectedEvent.category}
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an event to view details</p>
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {events
                  .filter(event => new Date(event.date) >= new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map((event, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedEvent(event)}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <span className="text-2xl">{event.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(event.date), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
