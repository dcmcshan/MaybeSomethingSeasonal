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

// Embedded calendar data with comprehensive Catholic liturgical calendar for 2025
const CALENDAR_DATA: CalendarEvent[] = [
  // January
  {
    title: "Solemnity of Mary, Mother of God",
    date: "2025-01-01",
    description: "New Year's Day - Mary as Theotokos, God-bearer.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Basil & St. Gregory",
    date: "2025-01-02",
    description: "Doctors of the Church, Cappadocian Fathers.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "Most Holy Name of Jesus",
    date: "2025-01-03",
    description: "Optional memorial of the Holy Name of Jesus.",
    icon: "✝️",
    category: "religious"
  },
  {
    title: "St. Elizabeth Ann Seton",
    date: "2025-01-04",
    description: "First American-born saint, founder of Sisters of Charity.",
    icon: "👩‍🏫",
    category: "religious"
  },
  {
    title: "St. John Neumann",
    date: "2025-01-05",
    description: "Bishop of Philadelphia, patron of Catholic education.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "Epiphany of the Lord",
    date: "2025-01-06",
    description: "Manifestation of Christ to the Gentiles.",
    icon: "⭐",
    category: "religious"
  },
  {
    title: "St. Raymond of Penyafort",
    date: "2025-01-07",
    description: "Dominican priest, patron of canon lawyers.",
    icon: "⚖️",
    category: "religious"
  },
  {
    title: "St. Apollinaris",
    date: "2025-01-08",
    description: "Bishop and martyr, patron of Ravenna.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "Baptism of the Lord",
    date: "2025-01-12",
    description: "End of Christmas season, Jesus baptized by John.",
    icon: "💧",
    category: "religious"
  },
  {
    title: "St. Hilary of Poitiers",
    date: "2025-01-13",
    description: "Doctor of the Church, defender against Arianism.",
    icon: "🛡️",
    category: "religious"
  },
  {
    title: "St. Felix of Nola",
    date: "2025-01-14",
    description: "Priest and confessor, patron of Nola.",
    icon: "🌿",
    category: "religious"
  },
  {
    title: "St. Paul the Hermit",
    date: "2025-01-15",
    description: "First Christian hermit, patron of hermits.",
    icon: "🏔️",
    category: "religious"
  },
  {
    title: "St. Marcellus I",
    date: "2025-01-16",
    description: "Pope and martyr, 30th Pope of Rome.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Anthony of Egypt",
    date: "2025-01-17",
    description: "Father of monasticism, desert hermit.",
    icon: "🏜️",
    category: "religious"
  },
  {
    title: "St. Prisca",
    date: "2025-01-18",
    description: "Virgin and martyr, patron of Rome.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Canute",
    date: "2025-01-19",
    description: "King of Denmark, martyr for justice.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Fabian & St. Sebastian",
    date: "2025-01-20",
    description: "Pope and martyr, soldier and martyr.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Agnes",
    date: "2025-01-21",
    description: "Virgin and martyr, patron of young girls.",
    icon: "👧",
    category: "religious"
  },
  {
    title: "St. Vincent",
    date: "2025-01-22",
    description: "Deacon and martyr, patron of charitable societies.",
    icon: "🤝",
    category: "religious"
  },
  {
    title: "St. Ildephonsus",
    date: "2025-01-23",
    description: "Archbishop of Toledo, Marian theologian.",
    icon: "📖",
    category: "religious"
  },
  {
    title: "St. Francis de Sales",
    date: "2025-01-24",
    description: "Bishop and Doctor of the Church, patron of writers.",
    icon: "✍️",
    category: "religious"
  },
  {
    title: "Conversion of St. Paul",
    date: "2025-01-25",
    description: "Apostle to the Gentiles, feast of conversion.",
    icon: "🛣️",
    category: "religious"
  },
  {
    title: "St. Timothy & St. Titus",
    date: "2025-01-26",
    description: "Bishops and disciples of St. Paul.",
    icon: "📜",
    category: "religious"
  },
  {
    title: "St. Angela Merici",
    date: "2025-01-27",
    description: "Founder of Ursulines, patron of educators.",
    icon: "👩‍🎓",
    category: "religious"
  },
  {
    title: "St. Thomas Aquinas",
    date: "2025-01-28",
    description: "Dominican priest, Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Gildas",
    date: "2025-01-29",
    description: "Monk and historian, patron of Wales.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "St. Martina",
    date: "2025-01-30",
    description: "Virgin and martyr, patron of Rome.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. John Bosco",
    date: "2025-01-31",
    description: "Founder of Salesians, patron of youth.",
    icon: "👦",
    category: "religious"
  },
  
  // February
  {
    title: "St. Brigid of Ireland",
    date: "2025-02-01",
    description: "Abbess and patron saint of Ireland.",
    icon: "🍀",
    category: "religious"
  },
  {
    title: "Presentation of the Lord",
    date: "2025-02-02",
    description: "Candlemas - Jesus presented in the Temple.",
    icon: "🕯️",
    category: "religious"
  },
  {
    title: "St. Blaise",
    date: "2025-02-03",
    description: "Bishop and martyr, patron of throat ailments.",
    icon: "🫁",
    category: "religious"
  },
  {
    title: "St. Andrew Corsini",
    date: "2025-02-04",
    description: "Carmelite bishop, patron of Florence.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Agatha",
    date: "2025-02-05",
    description: "Virgin and martyr, patron of breast cancer patients.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Paul Miki & Companions",
    date: "2025-02-06",
    description: "Japanese martyrs, first martyrs of Japan.",
    icon: "🇯🇵",
    category: "religious"
  },
  {
    title: "St. Colette",
    date: "2025-02-07",
    description: "Poor Clare nun, reformer of Franciscan order.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Jerome Emiliani",
    date: "2025-02-08",
    description: "Founder of Somaschi, patron of orphans.",
    icon: "👶",
    category: "religious"
  },
  {
    title: "St. Apollonia",
    date: "2025-02-09",
    description: "Virgin and martyr, patron of dentists.",
    icon: "🦷",
    category: "religious"
  },
  {
    title: "St. Scholastica",
    date: "2025-02-10",
    description: "Twin sister of St. Benedict, patron of nuns.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "Our Lady of Lourdes",
    date: "2025-02-11",
    description: "Apparition to St. Bernadette, patron of sick.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Julian the Hospitaller",
    date: "2025-02-12",
    description: "Patron of travelers and innkeepers.",
    icon: "🏨",
    category: "religious"
  },
  {
    title: "St. Catherine de Ricci",
    date: "2025-02-13",
    description: "Dominican nun, mystic and stigmatic.",
    icon: "✝️",
    category: "religious"
  },
  {
    title: "St. Valentine",
    date: "2025-02-14",
    description: "Priest and martyr, patron of love.",
    icon: "💕",
    category: "religious"
  },
  {
    title: "St. Onesimus",
    date: "2025-02-15",
    description: "Disciple of St. Paul, patron of slaves.",
    icon: "🔗",
    category: "religious"
  },
  {
    title: "St. Juliana",
    date: "2025-02-16",
    description: "Virgin and martyr, patron of sickness.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "Seven Founders of Servites",
    date: "2025-02-17",
    description: "Founders of Order of Servants of Mary.",
    icon: "👥",
    category: "religious"
  },
  {
    title: "St. Simeon",
    date: "2025-02-18",
    description: "Bishop and martyr, patron of Jerusalem.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Conrad of Piacenza",
    date: "2025-02-19",
    description: "Hermit and penitent, patron of Piacenza.",
    icon: "🏔️",
    category: "religious"
  },
  {
    title: "St. Eucherius",
    date: "2025-02-20",
    description: "Bishop of Orleans, patron of Orleans.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Peter Damian",
    date: "2025-02-21",
    description: "Cardinal and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "Chair of St. Peter",
    date: "2025-02-22",
    description: "Feast of the authority of St. Peter.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Polycarp",
    date: "2025-02-23",
    description: "Bishop and martyr, disciple of St. John.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Matthias",
    date: "2025-02-24",
    description: "Apostle chosen to replace Judas.",
    icon: "👥",
    category: "religious"
  },
  {
    title: "St. Walburga",
    date: "2025-02-25",
    description: "Benedictine abbess, patron of Germany.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Porphyry",
    date: "2025-02-26",
    description: "Bishop of Gaza, patron of Gaza.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Gabriel of Our Lady of Sorrows",
    date: "2025-02-27",
    description: "Passionist student, patron of students.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "St. Romanus",
    date: "2025-02-28",
    description: "Abbot and founder of Condat Abbey.",
    icon: "🏔️",
    category: "religious"
  },
  
  // March
  {
    title: "St. David of Wales",
    date: "2025-03-01",
    description: "Bishop and patron saint of Wales.",
    icon: "🌼",
    category: "religious"
  },
  {
    title: "St. Chad",
    date: "2025-03-02",
    description: "Bishop of Lichfield, patron of Birmingham.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Katharine Drexel",
    date: "2025-03-03",
    description: "Founder of Sisters of Blessed Sacrament.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Casimir",
    date: "2025-03-04",
    description: "Prince of Poland, patron of Poland.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. John Joseph of the Cross",
    date: "2025-03-05",
    description: "Franciscan priest, patron of Naples.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Colette",
    date: "2025-03-06",
    description: "Poor Clare nun, reformer of Franciscan order.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Perpetua & St. Felicity",
    date: "2025-03-07",
    description: "Martyrs of Carthage, patrons of mothers.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. John of God",
    date: "2025-03-08",
    description: "Founder of Hospitallers, patron of hospitals.",
    icon: "🏥",
    category: "religious"
  },
  {
    title: "St. Frances of Rome",
    date: "2025-03-09",
    description: "Founder of Oblates, patron of widows.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Simplicius",
    date: "2025-03-10",
    description: "Pope and defender against Monophysitism.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Eulogius",
    date: "2025-03-11",
    description: "Archbishop of Cordoba, martyr.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Maximilian",
    date: "2025-03-12",
    description: "Bishop and martyr, patron of Numidia.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Euphrasia",
    date: "2025-03-13",
    description: "Virgin and nun, patron of Constantinople.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Matilda",
    date: "2025-03-14",
    description: "Queen and saint, patron of large families.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Longinus",
    date: "2025-03-15",
    description: "Centurion who pierced Christ's side.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Patrick",
    date: "2025-03-17",
    description: "Bishop and patron saint of Ireland.",
    icon: "☘️",
    category: "religious"
  },
  {
    title: "St. Cyril of Jerusalem",
    date: "2025-03-18",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Joseph, Spouse of Mary",
    date: "2025-03-19",
    description: "Patron of the Universal Church.",
    icon: "🔨",
    category: "religious"
  },
  {
    title: "St. Cuthbert",
    date: "2025-03-20",
    description: "Bishop of Lindisfarne, patron of Northumbria.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Benedict",
    date: "2025-03-21",
    description: "Founder of Benedictine order, patron of Europe.",
    icon: "📖",
    category: "religious"
  },
  {
    title: "St. Lea",
    date: "2025-03-22",
    description: "Widow and nun, patron of widows.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Turibius",
    date: "2025-03-23",
    description: "Archbishop of Lima, patron of Peru.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Catherine of Sweden",
    date: "2025-03-24",
    description: "Bridgettine nun, patron of Sweden.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "Annunciation of the Lord",
    date: "2025-03-25",
    description: "Angel Gabriel announces to Mary.",
    icon: "👼",
    category: "religious"
  },
  {
    title: "St. Margaret Clitherow",
    date: "2025-03-26",
    description: "Martyr of England, patron of businesswomen.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Rupert",
    date: "2025-03-27",
    description: "Bishop of Salzburg, patron of Salzburg.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Hesychius",
    date: "2025-03-28",
    description: "Monk and martyr, patron of Jerusalem.",
    icon: "🏔️",
    category: "religious"
  },
  {
    title: "St. Berthold",
    date: "2025-03-29",
    description: "Carmelite prior, patron of Carmelites.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. John Climacus",
    date: "2025-03-30",
    description: "Monk and abbot, author of Ladder of Divine Ascent.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "St. Cornelia",
    date: "2025-03-31",
    description: "Virgin and martyr, patron of Rome.",
    icon: "🌹",
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
