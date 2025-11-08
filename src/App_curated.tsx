import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Calendar, MapPin, Printer } from 'lucide-react';
import './App.css';

interface CalendarEvent {
  title: string;
  date: string;
  description: string;
  icon: string;
  image?: string;
  category: string;
}

interface CategoryPalette {
  background: string;
  text: string;
  accent: string;
}

// Curated calendar data focusing on culturally significant feast days and seasonal celebrations
const CALENDAR_DATA: CalendarEvent[] = [
  // January
  {
    title: "New Year's Day",
    date: "2025-01-01",
    description: "Celebration of the new year and fresh beginnings.",
    icon: "🎊",
    image: "/images/image1.jpg",
    category: "celebration"
  },
  {
    title: "Epiphany of the Lord",
    date: "2025-01-06",
    description: "Manifestation of Christ to the Gentiles - Three Kings Day.",
    icon: "⭐",
    image: "/images/image2.jpg",
    category: "religious"
  },
  {
    title: "Día de los Reyes",
    date: "2025-01-06",
    description: "Three Kings Day - Epiphany celebration.",
    icon: "👑",
    category: "cultural"
  },
  {
    title: "Chinese New Year",
    date: "2025-01-29",
    description: "Lunar New Year celebration.",
    icon: "🐉",
    category: "cultural"
  },
  
  // February
  {
    title: "Imbolc",
    date: "2025-02-01",
    description: "Celtic festival marking the beginning of spring.",
    icon: "🌱",
    category: "seasonal"
  },
  {
    title: "Candlemas",
    date: "2025-02-02",
    description: "Blessing of candles and purification.",
    icon: "🕯️",
    category: "religious"
  },
  {
    title: "St. Blaise",
    date: "2025-02-03",
    description: "Patron saint of throat ailments - blessing of throats.",
    icon: "🩺",
    category: "religious"
  },
  {
    title: "St. Valentine",
    date: "2025-02-14",
    description: "Patron saint of love and romance.",
    icon: "💕",
    category: "cultural"
  },
  
  // March
  {
    title: "St. Patrick",
    date: "2025-03-17",
    description: "Patron saint of Ireland - celebrated worldwide.",
    icon: "☘️",
    category: "cultural"
  },
  {
    title: "St. Joseph",
    date: "2025-03-19",
    description: "Patron saint of workers and fathers.",
    icon: "🔨",
    category: "religious"
  },
  {
    title: "Annunciation of the Lord",
    date: "2025-03-25",
    description: "Angel Gabriel announces to Mary.",
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
    title: "Earth Day",
    date: "2025-04-22",
    description: "Celebrate our planet and environmental awareness.",
    icon: "🌍",
    category: "environmental"
  },
  {
    title: "St. George",
    date: "2025-04-23",
    description: "Patron saint of England and dragon slayer.",
    icon: "⚔️",
    category: "cultural"
  },
  
  // May
  {
    title: "St. Joseph the Worker",
    date: "2025-05-01",
    description: "Patron saint of workers and fathers.",
    icon: "🔨",
    category: "religious"
  },
  {
    title: "Our Lady of Fatima",
    date: "2025-05-13",
    description: "Apparition to three shepherd children.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Rita of Cascia",
    date: "2025-05-22",
    description: "Patron saint of impossible causes.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "Visitation of the Blessed Virgin Mary",
    date: "2025-05-31",
    description: "Mary visits Elizabeth.",
    icon: "👩‍👧",
    category: "religious"
  },
  
  // June
  {
    title: "St. Anthony of Padua",
    date: "2025-06-13",
    description: "Patron saint of lost things.",
    icon: "👜",
    category: "religious"
  },
  {
    title: "Nativity of St. John the Baptist",
    date: "2025-06-24",
    description: "Birth of St. John the Baptist.",
    icon: "🌅",
    category: "religious"
  },
  {
    title: "St. Peter & St. Paul",
    date: "2025-06-29",
    description: "Apostles and martyrs, patrons of Rome.",
    icon: "⛪",
    category: "religious"
  },
  
  // July
  {
    title: "Independence Day",
    date: "2025-07-04",
    description: "Celebration of American independence.",
    icon: "🇺🇸",
    category: "cultural"
  },
  {
    title: "St. Benedict",
    date: "2025-07-11",
    description: "Founder of Benedictine order, patron of Europe.",
    icon: "📖",
    category: "religious"
  },
  {
    title: "Our Lady of Mount Carmel",
    date: "2025-07-16",
    description: "Patroness of Carmelites and scapular devotion.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. James the Greater",
    date: "2025-07-25",
    description: "Apostle and martyr, patron of Spain.",
    icon: "👥",
    category: "religious"
  },
  
  // August
  {
    title: "St. Dominic",
    date: "2025-08-08",
    description: "Founder of Dominicans, patron of astronomers.",
    icon: "⭐",
    category: "religious"
  },
  {
    title: "Assumption of the Blessed Virgin Mary",
    date: "2025-08-15",
    description: "Mary is assumed body and soul into heaven.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Rose of Lima",
    date: "2025-08-23",
    description: "First saint of the Americas, patron of Peru.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Augustine",
    date: "2025-08-28",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  
  // September
  {
    title: "Nativity of the Blessed Virgin Mary",
    date: "2025-09-08",
    description: "Birth of the Blessed Virgin Mary.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "Exaltation of the Holy Cross",
    date: "2025-09-14",
    description: "Feast of the Triumph of the Cross.",
    icon: "✝️",
    category: "religious"
  },
  {
    title: "St. Matthew",
    date: "2025-09-21",
    description: "Evangelist and former tax collector.",
    icon: "📊",
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
    title: "St. Michael, St. Gabriel & St. Raphael",
    date: "2025-09-29",
    description: "Archangels, patrons of protection and healing.",
    icon: "👼",
    category: "religious"
  },
  
  // October
  {
    title: "St. Thérèse of Lisieux",
    date: "2025-10-01",
    description: "Little Flower, patron saint of missionaries.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "Guardian Angels",
    date: "2025-10-02",
    description: "Feast of the Guardian Angels.",
    icon: "👼",
    category: "religious"
  },
  {
    title: "St. Francis of Assisi",
    date: "2025-10-04",
    description: "Founder of Franciscans, patron of animals.",
    icon: "🐦",
    category: "religious"
  },
  {
    title: "Our Lady of the Rosary",
    date: "2025-10-07",
    description: "Feast of Our Lady of the Rosary.",
    icon: "📿",
    category: "religious"
  },
  {
    title: "Halloween",
    date: "2025-10-31",
    description: "All Hallows' Eve, celebration of saints and departed souls.",
    icon: "🎃",
    category: "celebration"
  },
  
  // November
  {
    title: "Día de los Muertos",
    date: "2025-11-01",
    description: "Day of the Dead - celebration of deceased loved ones.",
    icon: "💀",
    image: "/images/image6.png",
    category: "cultural"
  },
  {
    title: "All Saints' Day",
    date: "2025-11-01",
    description: "Celebration of all the saints in heaven.",
    icon: "👼",
    category: "religious"
  },
  {
    title: "All Souls' Day",
    date: "2025-11-02",
    description: "Prayer for the faithful departed.",
    icon: "🕊️",
    category: "religious"
  },
  {
    title: "St. Martin of Tours",
    date: "2025-11-11",
    description: "Patron saint of soldiers and beggars.",
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
  {
    title: "St. Andrew",
    date: "2025-11-30",
    description: "Apostle and martyr, patron of Scotland.",
    icon: "👥",
    category: "religious"
  },
  
  // December
  {
    title: "St. Francis Xavier",
    date: "2025-12-03",
    description: "Jesuit priest and missionary, patron of missions.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Nicholas",
    date: "2025-12-06",
    description: "Bishop and saint, patron of children and gift-giving.",
    icon: "🎁",
    image: "/images/image3.jpg",
    category: "religious"
  },
  {
    title: "Immaculate Conception",
    date: "2025-12-08",
    description: "Mary conceived without original sin.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "Our Lady of Guadalupe",
    date: "2025-12-12",
    description: "Patroness of the Americas and unborn children.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Lucy",
    date: "2025-12-13",
    description: "Virgin and martyr, patron of light and vision.",
    icon: "🕯️",
    image: "/images/image4.jpg",
    category: "religious"
  },
  {
    title: "Krampusnacht",
    date: "2025-12-05",
    description: "Krampus Night - the dark companion of St. Nicholas.",
    icon: "👹",
    image: "/images/image5.png",
    category: "cultural"
  },
  {
    title: "Sinterklaas Arrival",
    date: "2025-11-15",
    description: "Arrival of Sinterklaas in the Netherlands.",
    icon: "🚢",
    category: "cultural"
  },
  {
    title: "Lussi Day",
    date: "2025-12-13",
    description: "Swedish celebration of light and St. Lucia.",
    icon: "🕯️",
    category: "cultural"
  },
  {
    title: "Saturnalia",
    date: "2025-12-17",
    description: "Ancient Roman festival of Saturn.",
    icon: "🏛️",
    category: "cultural"
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
    title: "St. Stephen",
    date: "2025-12-26",
    description: "First Christian martyr, patron of deacons.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. John the Evangelist",
    date: "2025-12-27",
    description: "Apostle and evangelist, patron of writers.",
    icon: "📜",
    category: "religious"
  },
    {
      title: "Holy Innocents",
      date: "2025-12-28",
      description: "Commemoration of children killed by Herod.",
      icon: "👶",
      category: "religious"
    },
    {
      title: "New Year's Eve",
      date: "2025-12-31",
      description: "Ring out the old year and welcome the new with reflection and celebration.",
      icon: "🎆",
      category: "celebration"
    }
];

const CATEGORY_PALETTES: Record<string, CategoryPalette> = {
  seasonal: { background: '#d1fae5', text: '#166534', accent: '#bbf7d0' },
  environmental: { background: '#dbeafe', text: '#1d4ed8', accent: '#bfdbfe' },
  celebration: { background: '#ede9fe', text: '#5b21b6', accent: '#ddd6fe' },
  religious: { background: '#fef3c7', text: '#92400e', accent: '#fde68a' },
  cultural: { background: '#fce7f3', text: '#9d174d', accent: '#fbcfe8' },
  default: { background: '#f3f4f6', text: '#374151', accent: '#e5e7eb' }
};

const getCategoryPalette = (category: string): CategoryPalette =>
  CATEGORY_PALETTES[category] || CATEGORY_PALETTES.default;

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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
        seasonal: 'bg-green-100 text-green-800 border border-green-200',
        environmental: 'bg-blue-100 text-blue-800 border border-blue-200',
        celebration: 'bg-purple-100 text-purple-800 border border-purple-200',
        religious: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        cultural: 'bg-pink-100 text-pink-800 border border-pink-200',
        default: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    return colors[category] || colors.default;
  };

  const handleDownloadICS = () => {
    const link = document.createElement('a');
    link.href = './MSS.ics';
    link.download = 'MSS.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const showEventTooltip = (target: HTMLDivElement, eventData: CalendarEvent) => {
    const tooltip = document.createElement('div');
    tooltip.dataset.tooltip = 'true';
    tooltip.className = 'absolute z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs pointer-events-none';
    tooltip.innerHTML = `
      <div class="font-semibold mb-1">${eventData.title}</div>
      <div class="text-gray-300 mb-2">${format(new Date(eventData.date), 'MMMM d, yyyy')}</div>
      <div class="text-gray-200">${eventData.description}</div>
      ${eventData.image ? `<img src="${eventData.image}" class="mt-2 w-16 h-16 object-cover rounded" />` : ''}
    `;
    tooltip.style.left = '0';
    tooltip.style.top = '100%';
    tooltip.style.marginTop = '4px';
    target.appendChild(tooltip);
  };

  const hideEventTooltip = (target: HTMLDivElement) => {
    const tooltip = target.querySelector('[data-tooltip="true"]');
    if (tooltip) {
      tooltip.remove();
    }
  };

  const renderEventBadge = (
    eventItem: CalendarEvent,
    index: number,
    variant?: 'diagonal-top' | 'diagonal-bottom',
    paletteOverride?: CategoryPalette
  ): React.ReactNode => {
    const key = `${eventItem.date}-${eventItem.title}-${index}`;

    if (variant) {
      const palette = paletteOverride || getCategoryPalette(eventItem.category);
      const positionClass = variant === 'diagonal-top' ? 'top' : 'bottom';

      return (
        <div
          key={key}
          className={`diagonal-event-label ${positionClass}`}
          style={{ color: palette.text, borderColor: palette.accent }}
          onMouseEnter={(e) => showEventTooltip(e.currentTarget, eventItem)}
          onMouseLeave={(e) => hideEventTooltip(e.currentTarget)}
        >
          {eventItem.image ? (
            <img
              src={eventItem.image}
              alt={eventItem.title}
              className="event-icon-image"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const sibling = target.nextElementSibling as HTMLElement | null;
                if (sibling) {
                  sibling.style.display = 'inline';
                }
              }}
            />
          ) : null}
          <span
            className="event-icon-emoji"
            style={{ display: eventItem.image ? 'none' : 'inline' }}
          >
            {eventItem.icon}
          </span>
          <span className="event-title christmas-font truncate">
            {eventItem.title}
          </span>
        </div>
      );
    }

    return (
      <div
        key={key}
        className={`event-badge relative rounded p-1 flex items-center gap-1 group text-xs ${getCategoryColor(eventItem.category)}`}
        onMouseEnter={(e) => showEventTooltip(e.currentTarget, eventItem)}
        onMouseLeave={(e) => hideEventTooltip(e.currentTarget)}
      >
        {eventItem.image ? (
          <img
            src={eventItem.image}
            alt={eventItem.title}
            className="event-icon-image w-4 h-4 object-cover rounded"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const sibling = target.nextElementSibling as HTMLElement | null;
              if (sibling) {
                sibling.style.display = 'inline';
              }
            }}
          />
        ) : null}
        <span
          className="event-icon-emoji"
          style={{ display: eventItem.image ? 'none' : 'inline' }}
        >
          {eventItem.icon}
        </span>
        <span className="event-title christmas-font text-xs truncate">
          {eventItem.title}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 christmas-title">
              Maybe Something Seasonal
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              A calendar celebrating nature's cycles and seasonal moments
            </p>
          </div>
          
          {/* Action buttons in top right */}
          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={handleDownloadICS}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Download Calendar (.ics)"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Print Calendar"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Full Width Calendar */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 christmas-title">
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
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1 christmas-font">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map(day => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const diagonalPalettes = dayEvents.length === 2
                ? [
                    getCategoryPalette(dayEvents[0].category),
                    getCategoryPalette(dayEvents[1].category)
                  ]
                : null;

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-2 border rounded-lg relative ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-green-500' : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 christmas-font ${
                    isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                  } ${isToday ? 'text-green-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {diagonalPalettes ? (
                      <div
                        className="diagonal-event-wrapper"
                        style={{
                          background: `linear-gradient(135deg, ${diagonalPalettes[0].background} 0%, ${diagonalPalettes[0].background} 50%, ${diagonalPalettes[1].background} 50%, ${diagonalPalettes[1].background} 100%)`
                        }}
                      >
                        {renderEventBadge(dayEvents[0], 0, 'diagonal-top', diagonalPalettes[0])}
                        {renderEventBadge(dayEvents[1], 1, 'diagonal-bottom', diagonalPalettes[1])}
                      </div>
                    ) : (
                      <>
                        {dayEvents.slice(0, 3).map((event, index) => renderEventBadge(event, index))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

