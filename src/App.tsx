import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Calendar, MapPin, Printer } from 'lucide-react';
import './App.css';

interface CalendarEvent {
  title: string;
  date: string;
  description: string;
  icon: string;
  category: string;
}

// Embedded calendar data with recurring saint days and seasonal events for 2025
const CALENDAR_DATA: CalendarEvent[] = [
  // January
  {
    title: "New Year's Day",
    date: "2025-01-01",
    description: "Fresh start and new beginnings.",
    icon: "🎊",
    category: "celebration"
  },
  {
    title: "Epiphany",
    date: "2025-01-06",
    description: "Celebration of the Three Kings visiting the Christ child.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Anthony's Day",
    date: "2025-01-17",
    description: "Patron saint of lost things and animals.",
    icon: "🐕",
    category: "religious"
  },
  {
    title: "St. Agnes' Day",
    date: "2025-01-21",
    description: "Patron saint of young girls and chastity.",
    icon: "👧",
    category: "religious"
  },
  {
    title: "St. Paul's Day",
    date: "2025-01-25",
    description: "Conversion of St. Paul, apostle to the Gentiles.",
    icon: "✝️",
    category: "religious"
  },
  
  // February
  {
    title: "Candlemas",
    date: "2025-02-02",
    description: "Presentation of Jesus at the Temple, blessing of candles.",
    icon: "🕯️",
    category: "religious"
  },
  {
    title: "St. Blaise's Day",
    date: "2025-02-03",
    description: "Patron saint of throat ailments, blessing of throats.",
    icon: "🫁",
    category: "religious"
  },
  {
    title: "St. Valentine's Day",
    date: "2025-02-14",
    description: "Patron saint of love and happy marriages.",
    icon: "💕",
    category: "celebration"
  },
  {
    title: "St. Scholastica's Day",
    date: "2025-02-10",
    description: "Twin sister of St. Benedict, patron of nuns.",
    icon: "👩‍🦱",
    category: "religious"
  },
  
  // March
  {
    title: "St. David's Day",
    date: "2025-03-01",
    description: "Patron saint of Wales, celebrated with daffodils.",
    icon: "🌼",
    category: "cultural"
  },
  {
    title: "St. Patrick's Day",
    date: "2025-03-17",
    description: "Patron saint of Ireland, celebrated with shamrocks.",
    icon: "☘️",
    category: "cultural"
  },
  {
    title: "Spring Equinox",
    date: "2025-03-20",
    description: "The first day of spring! Time for renewal and growth.",
    icon: "🌸",
    category: "seasonal"
  },
  {
    title: "Annunciation",
    date: "2025-03-25",
    description: "The angel Gabriel announces to Mary that she will bear Jesus.",
    icon: "👼",
    category: "religious"
  },
  
  // April
  {
    title: "Easter Sunday",
    date: "2025-04-20",
    description: "Resurrection of Jesus Christ, the most important Christian feast.",
    icon: "🐣",
    category: "religious"
  },
  {
    title: "St. George's Day",
    date: "2025-04-23",
    description: "Patron saint of England, celebrated with roses.",
    icon: "🌹",
    category: "cultural"
  },
  {
    title: "Earth Day",
    date: "2025-04-22",
    description: "Celebrate our planet and environmental awareness.",
    icon: "🌍",
    category: "environmental"
  },
  
  // May
  {
    title: "May Day",
    date: "2025-05-01",
    description: "Traditional spring celebration with maypoles and flowers.",
    icon: "🌺",
    category: "seasonal"
  },
  {
    title: "St. Joseph's Day",
    date: "2025-05-01",
    description: "Patron saint of workers and fathers.",
    icon: "🔨",
    category: "religious"
  },
  {
    title: "St. Mark's Day",
    date: "2025-04-25",
    description: "Evangelist and patron saint of Venice.",
    icon: "📖",
    category: "religious"
  },
  {
    title: "Ascension Day",
    date: "2025-05-29",
    description: "Jesus ascends into heaven forty days after Easter.",
    icon: "☁️",
    category: "religious"
  },
  
  // June
  {
    title: "Pentecost",
    date: "2025-06-08",
    description: "Descent of the Holy Spirit upon the apostles.",
    icon: "🔥",
    category: "religious"
  },
  {
    title: "St. Anthony's Day",
    date: "2025-06-13",
    description: "Patron saint of lost things and the poor.",
    icon: "👜",
    category: "religious"
  },
  {
    title: "Summer Solstice",
    date: "2025-06-21",
    description: "The longest day of the year - peak of summer energy.",
    icon: "☀️",
    category: "seasonal"
  },
  {
    title: "St. John's Day",
    date: "2025-06-24",
    description: "Birth of St. John the Baptist, midsummer celebration.",
    icon: "🌅",
    category: "religious"
  },
  
  // July
  {
    title: "St. Peter & Paul's Day",
    date: "2025-06-29",
    description: "Feast of the apostles Peter and Paul.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "Independence Day",
    date: "2025-07-04",
    description: "Celebration of American independence.",
    icon: "🇺🇸",
    category: "cultural"
  },
  {
    title: "St. Mary Magdalene's Day",
    date: "2025-07-22",
    description: "Apostle to the apostles, witness to the resurrection.",
    icon: "🌿",
    category: "religious"
  },
  
  // August
  {
    title: "Lammas",
    date: "2025-08-01",
    description: "First harvest festival, celebration of grain.",
    icon: "🌾",
    category: "seasonal"
  },
  {
    title: "Transfiguration",
    date: "2025-08-06",
    description: "Jesus is transfigured on Mount Tabor.",
    icon: "✨",
    category: "religious"
  },
  {
    title: "Assumption of Mary",
    date: "2025-08-15",
    description: "Mary is assumed body and soul into heaven.",
    icon: "👑",
    category: "religious"
  },
  
  // September
  {
    title: "St. Michael's Day",
    date: "2025-09-29",
    description: "Archangel Michael, patron of warriors and protection.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "Autumn Equinox",
    date: "2025-09-22",
    description: "Fall begins - time for harvest and reflection.",
    icon: "🍂",
    category: "seasonal"
  },
  {
    title: "St. Matthew's Day",
    date: "2025-09-21",
    description: "Evangelist and former tax collector.",
    icon: "📊",
    category: "religious"
  },
  
  // October
  {
    title: "St. Francis' Day",
    date: "2025-10-04",
    description: "Patron saint of animals and ecology.",
    icon: "🐦",
    category: "religious"
  },
  {
    title: "Halloween",
    date: "2025-10-31",
    description: "All Hallows' Eve, celebration of saints and departed souls.",
    icon: "🎃",
    category: "celebration"
  },
  {
    title: "All Saints' Day",
    date: "2025-11-01",
    description: "Celebration of all the saints in heaven.",
    icon: "👼",
    category: "religious"
  },
  
  // November
  {
    title: "All Souls' Day",
    date: "2025-11-02",
    description: "Prayer for the faithful departed.",
    icon: "🕊️",
    category: "religious"
  },
  {
    title: "St. Martin's Day",
    date: "2025-11-11",
    description: "Patron saint of soldiers and beggars, Martinmas.",
    icon: "🪶",
    category: "religious"
  },
  {
    title: "Thanksgiving",
    date: "2025-11-27",
    description: "Gratitude for the harvest and blessings of the year.",
    icon: "🦃",
    category: "celebration"
  },
  
  // December
  {
    title: "St. Nicholas' Day",
    date: "2025-12-06",
    description: "Patron saint of children and gift-giving.",
    icon: "🎁",
    category: "celebration"
  },
  {
    title: "Immaculate Conception",
    date: "2025-12-08",
    description: "Mary conceived without original sin.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "Winter Solstice",
    date: "2025-12-21",
    description: "The shortest day - embrace the darkness and prepare for renewal.",
    icon: "❄️",
    category: "seasonal"
  },
  {
    title: "Christmas Eve",
    date: "2025-12-24",
    description: "Vigil of the Nativity, anticipation of Christ's birth.",
    icon: "🌟",
    category: "religious"
  },
  {
    title: "Christmas Day",
    date: "2025-12-25",
    description: "Birth of Jesus Christ, joy and celebration.",
    icon: "🎄",
    category: "celebration"
  },
  {
    title: "St. Stephen's Day",
    date: "2025-12-26",
    description: "First Christian martyr, patron of deacons.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. John's Day",
    date: "2025-12-27",
    description: "Evangelist and apostle, patron of writers.",
    icon: "📜",
    category: "religious"
  },
  {
    title: "Holy Innocents",
    date: "2025-12-28",
    description: "Commemoration of children killed by Herod.",
    icon: "👶",
    category: "religious"
  }
];

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use embedded data directly to avoid fetch issues
    setEvents(CALENDAR_DATA);
    setIsLoading(false);
    console.log('Calendar data loaded:', CALENDAR_DATA.length, 'events');
  }, []);

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
      religious: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cultural: 'bg-pink-100 text-pink-800 border-pink-200',
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

  const handlePrint = () => {
    window.print();
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
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleDownloadICS}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Calendar (.ics)
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Calendar
            </button>
          </div>
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
