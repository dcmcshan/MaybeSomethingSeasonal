import React, { useState, useEffect } from 'react';
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

// Embedded calendar data with comprehensive Catholic liturgical calendar for 2025
const CALENDAR_DATA: CalendarEvent[] = [
  // January
  {
    title: "Solemnity of Mary, Mother of God",
    date: "2025-01-01",
    description: "New Year's Day - Mary as Theotokos, God-bearer.",
    icon: "👑",
    image: "/images/image1.jpg",
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
    image: "/images/image2.jpg",
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
  },
  
  // April
  {
    title: "St. Hugh",
    date: "2025-04-01",
    description: "Bishop of Grenoble, patron of Grenoble.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Francis of Paola",
    date: "2025-04-02",
    description: "Founder of Minims, patron of Calabria.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Richard of Chichester",
    date: "2025-04-03",
    description: "Bishop of Chichester, patron of Sussex.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Isidore of Seville",
    date: "2025-04-04",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Vincent Ferrer",
    date: "2025-04-05",
    description: "Dominican priest, patron of builders.",
    icon: "🔨",
    category: "religious"
  },
  {
    title: "St. William of Eskilsoe",
    date: "2025-04-06",
    description: "Abbot and reformer, patron of Denmark.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. John Baptist de la Salle",
    date: "2025-04-07",
    description: "Founder of Christian Brothers, patron of teachers.",
    icon: "👨‍🏫",
    category: "religious"
  },
  {
    title: "Annunciation of the Lord",
    date: "2025-04-08",
    description: "Angel Gabriel announces to Mary (transferred).",
    icon: "👼",
    category: "religious"
  },
  {
    title: "St. Casilda",
    date: "2025-04-09",
    description: "Virgin and hermit, patron of Toledo.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Fulbert",
    date: "2025-04-10",
    description: "Bishop of Chartres, patron of Chartres.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Stanislaus",
    date: "2025-04-11",
    description: "Bishop and martyr, patron of Poland.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Zeno",
    date: "2025-04-12",
    description: "Bishop of Verona, patron of Verona.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Martin I",
    date: "2025-04-13",
    description: "Pope and martyr, defender of orthodoxy.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Lydwina",
    date: "2025-04-14",
    description: "Virgin and mystic, patron of skaters.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Hunna",
    date: "2025-04-15",
    description: "Noblewoman and saint, patron of laundresses.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Bernadette",
    date: "2025-04-16",
    description: "Visionary of Lourdes, patron of illness.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Anicetus",
    date: "2025-04-17",
    description: "Pope and martyr, 11th Pope of Rome.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Apollonius",
    date: "2025-04-18",
    description: "Philosopher and martyr, patron of philosophers.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "St. Leo IX",
    date: "2025-04-19",
    description: "Pope and reformer, patron of reform.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "Easter Sunday",
    date: "2025-04-20",
    description: "Resurrection of Jesus Christ, the most important Christian feast.",
    icon: "🐣",
    category: "religious"
  },
  {
    title: "St. Anselm",
    date: "2025-04-21",
    description: "Archbishop and Doctor of the Church.",
    icon: "🎓",
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
    description: "Martyr and patron saint of England.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Fidelis of Sigmaringen",
    date: "2025-04-24",
    description: "Capuchin priest and martyr.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Mark",
    date: "2025-04-25",
    description: "Evangelist and patron saint of Venice.",
    icon: "📖",
    category: "religious"
  },
  {
    title: "St. Cletus",
    date: "2025-04-26",
    description: "Pope and martyr, 3rd Pope of Rome.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Zita",
    date: "2025-04-27",
    description: "Virgin and servant, patron of servants.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Peter Chanel",
    date: "2025-04-28",
    description: "Marist priest and martyr, patron of Oceania.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Catherine of Siena",
    date: "2025-04-29",
    description: "Dominican nun and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Pius V",
    date: "2025-04-30",
    description: "Pope and reformer, patron of the Dominican order.",
    icon: "👑",
    category: "religious"
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
    title: "St. Athanasius",
    date: "2025-05-02",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Philip & St. James",
    date: "2025-05-03",
    description: "Apostles and martyrs.",
    icon: "👥",
    category: "religious"
  },
  {
    title: "St. Monica",
    date: "2025-05-04",
    description: "Mother of St. Augustine, patron of mothers.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Pius V",
    date: "2025-05-05",
    description: "Pope and reformer, patron of the Dominican order.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Evodius",
    date: "2025-05-06",
    description: "Bishop of Antioch, successor to St. Peter.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Rose Venerini",
    date: "2025-05-07",
    description: "Founder of Venerini Sisters, patron of educators.",
    icon: "👩‍🎓",
    category: "religious"
  },
  {
    title: "St. Victor",
    date: "2025-05-08",
    description: "Martyr and patron of Milan.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Pachomius",
    date: "2025-05-09",
    description: "Founder of cenobitic monasticism.",
    icon: "🏔️",
    category: "religious"
  },
  {
    title: "St. Antoninus",
    date: "2025-05-10",
    description: "Dominican archbishop, patron of Florence.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Ignatius of Laconi",
    date: "2025-05-11",
    description: "Capuchin lay brother, patron of Sardinia.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Nereus & St. Achilleus",
    date: "2025-05-12",
    description: "Martyrs and soldiers, patrons of Rome.",
    icon: "⚔️",
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
    title: "St. Matthias",
    date: "2025-05-14",
    description: "Apostle chosen to replace Judas.",
    icon: "👥",
    category: "religious"
  },
  {
    title: "St. Isidore the Farmer",
    date: "2025-05-15",
    description: "Layman and saint, patron of farmers.",
    icon: "🌾",
    category: "religious"
  },
  {
    title: "St. Simon Stock",
    date: "2025-05-16",
    description: "Carmelite prior, patron of Carmelites.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Paschal Baylon",
    date: "2025-05-17",
    description: "Franciscan lay brother, patron of Eucharistic congresses.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. John I",
    date: "2025-05-18",
    description: "Pope and martyr, 53rd Pope of Rome.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Celestine V",
    date: "2025-05-19",
    description: "Pope and hermit, patron of bookbinders.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Bernardine of Siena",
    date: "2025-05-20",
    description: "Franciscan priest, patron of public relations.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Christopher Magallanes",
    date: "2025-05-21",
    description: "Priest and martyr, patron of Mexico.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Rita of Cascia",
    date: "2025-05-22",
    description: "Augustinian nun, patron of impossible causes.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Ivo",
    date: "2025-05-23",
    description: "Priest and lawyer, patron of lawyers.",
    icon: "⚖️",
    category: "religious"
  },
  {
    title: "St. Vincent of Lerins",
    date: "2025-05-24",
    description: "Monk and theologian, patron of theologians.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "St. Bede the Venerable",
    date: "2025-05-25",
    description: "Monk and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Philip Neri",
    date: "2025-05-26",
    description: "Founder of Oratorians, patron of joy.",
    icon: "😊",
    category: "religious"
  },
  {
    title: "St. Augustine of Canterbury",
    date: "2025-05-27",
    description: "Bishop and missionary, patron of England.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Germanus",
    date: "2025-05-28",
    description: "Bishop of Paris, patron of Paris.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Madeleine Sophie Barat",
    date: "2025-05-29",
    description: "Founder of Sacred Heart Sisters.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Joan of Arc",
    date: "2025-05-30",
    description: "Virgin and martyr, patron of France.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "Visitation of the Blessed Virgin Mary",
    date: "2025-05-31",
    description: "Mary visits Elizabeth, patron of pregnant women.",
    icon: "👩‍👧",
    category: "religious"
  },
  
  // June
  {
    title: "St. Justin",
    date: "2025-06-01",
    description: "Philosopher and martyr, patron of philosophers.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "St. Marcellinus & St. Peter",
    date: "2025-06-02",
    description: "Martyrs and patrons of Rome.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Charles Lwanga & Companions",
    date: "2025-06-03",
    description: "Ugandan martyrs, patrons of Africa.",
    icon: "🇺🇬",
    category: "religious"
  },
  {
    title: "St. Francis Caracciolo",
    date: "2025-06-04",
    description: "Founder of Minor Clerics Regular.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Boniface",
    date: "2025-06-05",
    description: "Bishop and martyr, patron of Germany.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Norbert",
    date: "2025-06-06",
    description: "Founder of Premonstratensians.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Robert",
    date: "2025-06-07",
    description: "Abbot of Citeaux, founder of Cistercians.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Medard",
    date: "2025-06-08",
    description: "Bishop of Noyon, patron of farmers.",
    icon: "🌾",
    category: "religious"
  },
  {
    title: "St. Ephrem",
    date: "2025-06-09",
    description: "Deacon and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Getulius",
    date: "2025-06-10",
    description: "Martyr and patron of Sabina.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Barnabas",
    date: "2025-06-11",
    description: "Apostle and companion of St. Paul.",
    icon: "👥",
    category: "religious"
  },
  {
    title: "St. John of Sahagun",
    date: "2025-06-12",
    description: "Augustinian priest, patron of Salamanca.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Anthony of Padua",
    date: "2025-06-13",
    description: "Franciscan priest, patron of lost things.",
    icon: "👜",
    category: "religious"
  },
  {
    title: "St. Basil the Great",
    date: "2025-06-14",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Vitus",
    date: "2025-06-15",
    description: "Martyr and patron of dancers.",
    icon: "💃",
    category: "religious"
  },
  {
    title: "St. John Francis Regis",
    date: "2025-06-16",
    description: "Jesuit priest, patron of lacemakers.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Avitus",
    date: "2025-06-17",
    description: "Bishop of Clermont, patron of Auvergne.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Ephrem",
    date: "2025-06-18",
    description: "Deacon and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Romuald",
    date: "2025-06-19",
    description: "Founder of Camaldolese order.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Silverius",
    date: "2025-06-20",
    description: "Pope and martyr, 58th Pope of Rome.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Aloysius Gonzaga",
    date: "2025-06-21",
    description: "Jesuit scholastic, patron of youth.",
    icon: "👦",
    category: "religious"
  },
  {
    title: "St. Paulinus of Nola",
    date: "2025-06-22",
    description: "Bishop and poet, patron of Nola.",
    icon: "📜",
    category: "religious"
  },
  {
    title: "St. Joseph Cafasso",
    date: "2025-06-23",
    description: "Priest and teacher, patron of prisoners.",
    icon: "⛪",
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
    title: "St. William",
    date: "2025-06-25",
    description: "Abbot and founder of Montevergine.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Josemaria Escriva",
    date: "2025-06-26",
    description: "Founder of Opus Dei, patron of ordinary work.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Cyril of Alexandria",
    date: "2025-06-27",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Irenaeus",
    date: "2025-06-28",
    description: "Bishop and martyr, patron of theologians.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "St. Peter & St. Paul",
    date: "2025-06-29",
    description: "Apostles and martyrs, patrons of Rome.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "First Martyrs of Rome",
    date: "2025-06-30",
    description: "Early Christian martyrs of Rome.",
    icon: "⚔️",
    category: "religious"
  },
  
  // July
  {
    title: "St. Junipero Serra",
    date: "2025-07-01",
    description: "Franciscan missionary, founder of California missions.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Oliver Plunkett",
    date: "2025-07-01",
    description: "Archbishop and martyr, patron of Ireland.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Thomas",
    date: "2025-07-03",
    description: "Apostle and doubter, patron of architects.",
    icon: "👥",
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
    title: "St. Anthony Zaccaria",
    date: "2025-07-05",
    description: "Founder of Barnabites, patron of physicians.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Maria Goretti",
    date: "2025-07-06",
    description: "Virgin and martyr, patron of purity.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Willibald",
    date: "2025-07-07",
    description: "Bishop and missionary, patron of Eichstätt.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Kilian",
    date: "2025-07-08",
    description: "Bishop and martyr, patron of Würzburg.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Augustine Zhao Rong",
    date: "2025-07-09",
    description: "Priest and martyr, patron of China.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Felicity",
    date: "2025-07-10",
    description: "Martyr and patron of mothers.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Benedict",
    date: "2025-07-11",
    description: "Founder of Benedictine order, patron of Europe.",
    icon: "📖",
    category: "religious"
  },
  {
    title: "St. Veronica",
    date: "2025-07-12",
    description: "Woman who wiped Jesus' face, patron of photographers.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Henry",
    date: "2025-07-13",
    description: "Emperor and saint, patron of Benedictine oblates.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Camillus de Lellis",
    date: "2025-07-14",
    description: "Founder of Camillians, patron of nurses.",
    icon: "🏥",
    category: "religious"
  },
  {
    title: "St. Bonaventure",
    date: "2025-07-15",
    description: "Franciscan bishop and Doctor of the Church.",
    icon: "🎓",
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
    title: "St. Alexius",
    date: "2025-07-17",
    description: "Confessor and patron of beggars.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Frederick",
    date: "2025-07-18",
    description: "Bishop and martyr, patron of Utrecht.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Arsenius",
    date: "2025-07-19",
    description: "Monk and hermit, patron of teachers.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "St. Apollinaris",
    date: "2025-07-20",
    description: "Bishop and martyr, patron of Ravenna.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Lawrence of Brindisi",
    date: "2025-07-21",
    description: "Capuchin priest and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Mary Magdalene",
    date: "2025-07-22",
    description: "Apostle to the apostles, witness to the resurrection.",
    icon: "🌿",
    category: "religious"
  },
  {
    title: "St. Bridget",
    date: "2025-07-23",
    description: "Founder of Bridgettines, patron of Sweden.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Sharbel",
    date: "2025-07-24",
    description: "Maronite monk and hermit, patron of Lebanon.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. James the Greater",
    date: "2025-07-25",
    description: "Apostle and martyr, patron of Spain.",
    icon: "👥",
    category: "religious"
  },
  {
    title: "St. Joachim & St. Anne",
    date: "2025-07-26",
    description: "Parents of the Blessed Virgin Mary.",
    icon: "👴👵",
    category: "religious"
  },
  {
    title: "St. Pantaleon",
    date: "2025-07-27",
    description: "Physician and martyr, patron of doctors.",
    icon: "⚕️",
    category: "religious"
  },
  {
    title: "St. Nazarius & St. Celsus",
    date: "2025-07-28",
    description: "Martyrs and patrons of Milan.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Martha",
    date: "2025-07-29",
    description: "Sister of Mary and Lazarus, patron of cooks.",
    icon: "👩‍🍳",
    category: "religious"
  },
  {
    title: "St. Peter Chrysologus",
    date: "2025-07-30",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Ignatius of Loyola",
    date: "2025-07-31",
    description: "Founder of Jesuits, patron of retreats.",
    icon: "⛪",
    category: "religious"
  },
  
  // August
  {
    title: "St. Alphonsus Liguori",
    date: "2025-08-01",
    description: "Founder of Redemptorists, Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Eusebius",
    date: "2025-08-02",
    description: "Bishop and martyr, patron of Vercelli.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Lydia",
    date: "2025-08-03",
    description: "First European convert, patron of dyers.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. John Vianney",
    date: "2025-08-04",
    description: "Curé of Ars, patron of parish priests.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "Dedication of St. Mary Major",
    date: "2025-08-05",
    description: "Basilica dedicated to the Blessed Virgin Mary.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "Transfiguration of the Lord",
    date: "2025-08-06",
    description: "Jesus is transfigured on Mount Tabor.",
    icon: "✨",
    category: "religious"
  },
  {
    title: "St. Sixtus II",
    date: "2025-08-07",
    description: "Pope and martyr, patron of Rome.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Dominic",
    date: "2025-08-08",
    description: "Founder of Dominicans, patron of astronomers.",
    icon: "⭐",
    category: "religious"
  },
  {
    title: "St. Teresa Benedicta",
    date: "2025-08-09",
    description: "Carmelite nun and martyr, patron of Europe.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Lawrence",
    date: "2025-08-10",
    description: "Deacon and martyr, patron of cooks.",
    icon: "🔥",
    category: "religious"
  },
  {
    title: "St. Clare",
    date: "2025-08-11",
    description: "Founder of Poor Clares, patron of television.",
    icon: "📺",
    category: "religious"
  },
  {
    title: "St. Jane Frances de Chantal",
    date: "2025-08-12",
    description: "Founder of Visitation Sisters, patron of widows.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Pontian & St. Hippolytus",
    date: "2025-08-13",
    description: "Pope and priest, martyrs of Rome.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Maximilian Kolbe",
    date: "2025-08-14",
    description: "Franciscan priest and martyr, patron of prisoners.",
    icon: "⛪",
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
    title: "St. Stephen of Hungary",
    date: "2025-08-16",
    description: "King and saint, patron of Hungary.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Hyacinth",
    date: "2025-08-17",
    description: "Dominican priest, patron of Poland.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Helena",
    date: "2025-08-18",
    description: "Empress and saint, finder of the True Cross.",
    icon: "✝️",
    category: "religious"
  },
  {
    title: "St. John Eudes",
    date: "2025-08-19",
    description: "Founder of Eudists, patron of France.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Bernard",
    date: "2025-08-20",
    description: "Cistercian abbot and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Pius X",
    date: "2025-08-21",
    description: "Pope and saint, patron of first communicants.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "Queenship of Mary",
    date: "2025-08-22",
    description: "Mary as Queen of Heaven and Earth.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Rose of Lima",
    date: "2025-08-23",
    description: "Dominican tertiary, patron of Peru.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Bartholomew",
    date: "2025-08-24",
    description: "Apostle and martyr, patron of tanners.",
    icon: "👥",
    category: "religious"
  },
  {
    title: "St. Louis IX",
    date: "2025-08-25",
    description: "King of France, patron of France.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Joseph Calasanz",
    date: "2025-08-26",
    description: "Founder of Piarists, patron of schools.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Monica",
    date: "2025-08-27",
    description: "Mother of St. Augustine, patron of mothers.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Augustine",
    date: "2025-08-28",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "Martyrdom of St. John the Baptist",
    date: "2025-08-29",
    description: "Beheading of St. John the Baptist.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Jeanne Jugan",
    date: "2025-08-30",
    description: "Founder of Little Sisters of the Poor.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Aidan",
    date: "2025-08-31",
    description: "Bishop and missionary, patron of Northumbria.",
    icon: "⛪",
    category: "religious"
  },
  
  // September
  {
    title: "St. Giles",
    date: "2025-09-01",
    description: "Abbot and hermit, patron of cripples.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Ingrid",
    date: "2025-09-02",
    description: "Dominican nun, patron of Sweden.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Gregory the Great",
    date: "2025-09-03",
    description: "Pope and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Rosalia",
    date: "2025-09-04",
    description: "Virgin and hermit, patron of Palermo.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Teresa of Calcutta",
    date: "2025-09-05",
    description: "Founder of Missionaries of Charity.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Eleutherius",
    date: "2025-09-06",
    description: "Bishop and martyr, patron of Spoleto.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Cloud",
    date: "2025-09-07",
    description: "Abbot and hermit, patron of France.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "Nativity of the Blessed Virgin Mary",
    date: "2025-09-08",
    description: "Birth of the Blessed Virgin Mary.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Peter Claver",
    date: "2025-09-09",
    description: "Jesuit priest, patron of slaves.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Nicholas of Tolentino",
    date: "2025-09-10",
    description: "Augustinian priest, patron of souls in purgatory.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. John Gabriel Perboyre",
    date: "2025-09-11",
    description: "Vincentian priest and martyr, patron of China.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "Most Holy Name of Mary",
    date: "2025-09-12",
    description: "Feast of the Holy Name of Mary.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. John Chrysostom",
    date: "2025-09-13",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
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
    title: "Our Lady of Sorrows",
    date: "2025-09-15",
    description: "Mary's seven sorrows, patron of suffering.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Cornelius & St. Cyprian",
    date: "2025-09-16",
    description: "Pope and bishop, martyrs of Rome.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Robert Bellarmine",
    date: "2025-09-17",
    description: "Jesuit cardinal and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Joseph of Cupertino",
    date: "2025-09-18",
    description: "Franciscan priest, patron of aviators.",
    icon: "✈️",
    category: "religious"
  },
  {
    title: "St. Januarius",
    date: "2025-09-19",
    description: "Bishop and martyr, patron of Naples.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Andrew Kim Taegon & Companions",
    date: "2025-09-20",
    description: "Korean martyrs, patrons of Korea.",
    icon: "🇰🇷",
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
    title: "St. Pio of Pietrelcina",
    date: "2025-09-23",
    description: "Capuchin priest and stigmatic, patron of volunteers.",
    icon: "✝️",
    category: "religious"
  },
  {
    title: "St. Gerard Sagredo",
    date: "2025-09-24",
    description: "Benedictine monk and martyr, patron of Hungary.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Finbar",
    date: "2025-09-25",
    description: "Bishop and founder, patron of Cork.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Cosmas & St. Damian",
    date: "2025-09-26",
    description: "Physicians and martyrs, patrons of doctors.",
    icon: "⚕️",
    category: "religious"
  },
  {
    title: "St. Vincent de Paul",
    date: "2025-09-27",
    description: "Founder of Vincentians, patron of charities.",
    icon: "🤝",
    category: "religious"
  },
  {
    title: "St. Wenceslaus",
    date: "2025-09-28",
    description: "Duke and martyr, patron of Bohemia.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Michael, St. Gabriel & St. Raphael",
    date: "2025-09-29",
    description: "Archangels, patrons of protection and healing.",
    icon: "👼",
    category: "religious"
  },
  {
    title: "St. Jerome",
    date: "2025-09-30",
    description: "Priest and Doctor of the Church, translator of Bible.",
    icon: "🎓",
    category: "religious"
  },
  
  // October
  {
    title: "St. Thérèse of Lisieux",
    date: "2025-10-01",
    description: "Carmelite nun and Doctor of the Church.",
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
    title: "St. Faustina Kowalska",
    date: "2025-10-05",
    description: "Apostle of Divine Mercy, patron of mercy.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Bruno",
    date: "2025-10-06",
    description: "Founder of Carthusians, patron of exorcists.",
    icon: "⛪",
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
    title: "St. Pelagia",
    date: "2025-10-08",
    description: "Virgin and martyr, patron of actresses.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Denis",
    date: "2025-10-09",
    description: "Bishop and martyr, patron of France.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Francis Borgia",
    date: "2025-10-10",
    description: "Jesuit priest, patron of Portugal.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. John XXIII",
    date: "2025-10-11",
    description: "Pope and saint, convener of Vatican II.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Seraphin",
    date: "2025-10-12",
    description: "Capuchin lay brother, patron of Italy.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Edward the Confessor",
    date: "2025-10-13",
    description: "King of England, patron of England.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Callistus I",
    date: "2025-10-14",
    description: "Pope and martyr, patron of cemetery workers.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Teresa of Avila",
    date: "2025-10-15",
    description: "Carmelite nun and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Hedwig",
    date: "2025-10-16",
    description: "Duchess and saint, patron of Silesia.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Ignatius of Antioch",
    date: "2025-10-17",
    description: "Bishop and martyr, patron of the Church.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Luke",
    date: "2025-10-18",
    description: "Evangelist and physician, patron of artists.",
    icon: "🎨",
    category: "religious"
  },
  {
    title: "St. Isaac Jogues & Companions",
    date: "2025-10-19",
    description: "Jesuit martyrs, patrons of North America.",
    icon: "🇺🇸",
    category: "religious"
  },
  {
    title: "St. Paul of the Cross",
    date: "2025-10-20",
    description: "Founder of Passionists, patron of Italy.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Ursula",
    date: "2025-10-21",
    description: "Virgin and martyr, patron of students.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. John Paul II",
    date: "2025-10-22",
    description: "Pope and saint, patron of families.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. John of Capistrano",
    date: "2025-10-23",
    description: "Franciscan priest, patron of military chaplains.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Anthony Claret",
    date: "2025-10-24",
    description: "Founder of Claretians, patron of textile workers.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Crispin & St. Crispinian",
    date: "2025-10-25",
    description: "Martyrs and patrons of shoemakers.",
    icon: "👟",
    category: "religious"
  },
  {
    title: "St. Cedd",
    date: "2025-10-26",
    description: "Bishop and missionary, patron of Essex.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Frumentius",
    date: "2025-10-27",
    description: "Bishop and missionary, patron of Ethiopia.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Simon & St. Jude",
    date: "2025-10-28",
    description: "Apostles and martyrs, patrons of lost causes.",
    icon: "👥",
    category: "religious"
  },
  {
    title: "St. Narcissus",
    date: "2025-10-29",
    description: "Bishop and martyr, patron of Jerusalem.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Marcellus",
    date: "2025-10-30",
    description: "Centurion and martyr, patron of Spain.",
    icon: "⚔️",
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
    title: "St. Martin de Porres",
    date: "2025-11-03",
    description: "Dominican lay brother, patron of social justice.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Charles Borromeo",
    date: "2025-11-04",
    description: "Archbishop and reformer, patron of seminarians.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Elizabeth",
    date: "2025-11-05",
    description: "Mother of St. John the Baptist, patron of pregnant women.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Leonard",
    date: "2025-11-06",
    description: "Abbot and hermit, patron of prisoners.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Willibrord",
    date: "2025-11-07",
    description: "Bishop and missionary, patron of Netherlands.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Godfrey",
    date: "2025-11-08",
    description: "Bishop and martyr, patron of Amiens.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "Dedication of Lateran Basilica",
    date: "2025-11-09",
    description: "Mother and head of all churches.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Leo the Great",
    date: "2025-11-10",
    description: "Pope and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Martin of Tours",
    date: "2025-11-11",
    description: "Bishop and saint, patron of soldiers.",
    icon: "🪶",
    category: "religious"
  },
  {
    title: "St. Josaphat",
    date: "2025-11-12",
    description: "Bishop and martyr, patron of unity.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Frances Xavier Cabrini",
    date: "2025-11-13",
    description: "Founder of Missionary Sisters, patron of immigrants.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Lawrence O'Toole",
    date: "2025-11-14",
    description: "Archbishop of Dublin, patron of Ireland.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Albert the Great",
    date: "2025-11-15",
    description: "Dominican bishop and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Margaret of Scotland",
    date: "2025-11-16",
    description: "Queen and saint, patron of Scotland.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Elizabeth of Hungary",
    date: "2025-11-17",
    description: "Princess and saint, patron of hospitals.",
    icon: "🏥",
    category: "religious"
  },
  {
    title: "Dedication of Basilicas of St. Peter & St. Paul",
    date: "2025-11-18",
    description: "Feast of the dedication of Roman basilicas.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Mechtilde",
    date: "2025-11-19",
    description: "Benedictine nun and mystic, patron of Germany.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Edmund",
    date: "2025-11-20",
    description: "King and martyr, patron of England.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "Presentation of the Blessed Virgin Mary",
    date: "2025-11-21",
    description: "Mary presented in the Temple as a child.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Cecilia",
    date: "2025-11-22",
    description: "Virgin and martyr, patron of musicians.",
    icon: "🎵",
    category: "religious"
  },
  {
    title: "St. Clement I",
    date: "2025-11-23",
    description: "Pope and martyr, patron of mariners.",
    icon: "⛵",
    category: "religious"
  },
  {
    title: "St. Chrysogonus",
    date: "2025-11-24",
    description: "Martyr and patron of Aquileia.",
    icon: "⚔️",
    category: "religious"
  },
  {
    title: "St. Catherine of Alexandria",
    date: "2025-11-25",
    description: "Virgin and martyr, patron of philosophers.",
    icon: "📚",
    category: "religious"
  },
  {
    title: "St. Leonard of Port Maurice",
    date: "2025-11-26",
    description: "Franciscan priest, patron of missions.",
    icon: "⛪",
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
    title: "St. James of the Marches",
    date: "2025-11-28",
    description: "Franciscan priest, patron of Italy.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Saturninus",
    date: "2025-11-29",
    description: "Bishop and martyr, patron of Toulouse.",
    icon: "⛪",
    category: "religious"
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
    title: "St. Edmund Campion",
    date: "2025-12-01",
    description: "Jesuit priest and martyr, patron of England.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Bibiana",
    date: "2025-12-02",
    description: "Virgin and martyr, patron of Rome.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Francis Xavier",
    date: "2025-12-03",
    description: "Jesuit priest and missionary, patron of missions.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. John Damascene",
    date: "2025-12-04",
    description: "Priest and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Sabas",
    date: "2025-12-05",
    description: "Abbot and founder, patron of Palestine.",
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
    title: "St. Ambrose",
    date: "2025-12-07",
    description: "Bishop and Doctor of the Church.",
    icon: "🎓",
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
    title: "St. Juan Diego",
    date: "2025-12-09",
    description: "Visionary of Guadalupe, patron of Mexico.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "Our Lady of Loreto",
    date: "2025-12-10",
    description: "Patroness of aviators and builders.",
    icon: "✈️",
    category: "religious"
  },
  {
    title: "St. Damasus I",
    date: "2025-12-11",
    description: "Pope and saint, patron of archaeologists.",
    icon: "👑",
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
    title: "St. John of the Cross",
    date: "2025-12-14",
    description: "Carmelite priest and Doctor of the Church.",
    icon: "🎓",
    category: "religious"
  },
  {
    title: "St. Mary Di Rosa",
    date: "2025-12-15",
    description: "Founder of Handmaids of Charity.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. Adelaide",
    date: "2025-12-16",
    description: "Empress and saint, patron of abuse victims.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Lazarus",
    date: "2025-12-17",
    description: "Friend of Jesus, patron of lepers.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Gatian",
    date: "2025-12-18",
    description: "Bishop and founder, patron of Tours.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Urban V",
    date: "2025-12-19",
    description: "Pope and saint, patron of Benedictines.",
    icon: "👑",
    category: "religious"
  },
  {
    title: "St. Dominic of Silos",
    date: "2025-12-20",
    description: "Abbot and saint, patron of prisoners.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Peter Canisius",
    date: "2025-12-21",
    description: "Jesuit priest and Doctor of the Church.",
    icon: "🎓",
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
    title: "St. Frances Xavier Cabrini",
    date: "2025-12-22",
    description: "Founder of Missionary Sisters, patron of immigrants.",
    icon: "👩‍🦱",
    category: "religious"
  },
  {
    title: "St. John of Kanty",
    date: "2025-12-23",
    description: "Priest and saint, patron of Poland.",
    icon: "⛪",
    category: "religious"
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
    title: "St. Thomas Becket",
    date: "2025-12-29",
    description: "Archbishop and martyr, patron of England.",
    icon: "⛪",
    category: "religious"
  },
  {
    title: "St. Anysia",
    date: "2025-12-30",
    description: "Virgin and martyr, patron of Thessalonica.",
    icon: "🌹",
    category: "religious"
  },
  {
    title: "St. Sylvester I",
    date: "2025-12-31",
    description: "Pope and saint, patron of New Year's Eve.",
    icon: "👑",
    category: "religious"
  },
  
  // Additional events from Excel file
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
  {
    title: "Imbolc",
    date: "2025-02-01",
    description: "Celtic festival marking the beginning of spring.",
    icon: "🌱",
    category: "seasonal"
  },
  {
    title: "Candelaria",
    date: "2025-02-02",
    description: "Candlemas - blessing of candles and purification.",
    icon: "🕯️",
    category: "religious"
  }
];

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadCatholicOnly, setDownloadCatholicOnly] = useState<boolean>(false);

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

  const escapeIcsText = (value: string): string => {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  };

  const buildIcsFromEvents = (icsEvents: CalendarEvent[], calendarName: string, calendarDesc: string): string => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    let ics = '';
    ics += 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//MaybeSomethingSeasonal//Calendar//EN\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';
    ics += 'METHOD:PUBLISH\r\n';
    ics += `X-WR-CALNAME:${escapeIcsText(calendarName)}\r\n`;
    ics += `X-WR-CALDESC:${escapeIcsText(calendarDesc)}\r\n`;

    icsEvents.forEach((event, index) => {
      const startDate = new Date(`${event.date}T00:00:00Z`);
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      const dtStart = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtEnd = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const uid = `event-${index}-${Date.now()}@maybesomethingseasonal.com`;

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${uid}\r\n`;
      ics += `DTSTAMP:${timestamp}\r\n`;
      ics += `DTSTART:${dtStart}\r\n`;
      ics += `DTEND:${dtEnd}\r\n`;
      ics += `SUMMARY:${escapeIcsText(event.title)}\r\n`;
      ics += `DESCRIPTION:${escapeIcsText(event.description)}\r\n`;
      ics += `CATEGORIES:${escapeIcsText(event.category)}\r\n`;
      ics += 'STATUS:CONFIRMED\r\n';
      ics += 'TRANSP:TRANSPARENT\r\n';
      ics += 'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR';
    return ics;
  };

  const handleDownloadICS = () => {
    if (downloadCatholicOnly) {
      const catholicEvents = CALENDAR_DATA.filter((e) => e.category === 'religious');
      const icsContent = buildIcsFromEvents(
        catholicEvents,
        'Catholic Liturgical Calendar',
        'Catholic liturgical feasts and memorials'
      );

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Catholic.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

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
          <div className="absolute top-0 right-0 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 bg-white/70 px-2 py-1 rounded-md border">
              <input
                type="checkbox"
                checked={downloadCatholicOnly}
                onChange={(e) => setDownloadCatholicOnly(e.target.checked)}
              />
              <span className="whitespace-nowrap">Catholic .ics</span>
            </label>
            <button
              onClick={handleDownloadICS}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title={downloadCatholicOnly ? 'Download Catholic (.ics)' : 'Download Calendar (.ics)'}
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
                    {dayEvents.slice(0, 3).map((event, index) => (
                      <div
                        key={index}
                        className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-all group relative ${getCategoryColor(event.category)}`}
                        onMouseEnter={(e) => {
                          const tooltip = document.createElement('div');
                          tooltip.className = 'absolute z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs pointer-events-none';
                          tooltip.innerHTML = `
                            <div class="font-semibold mb-1">${event.title}</div>
                            <div class="text-gray-300 mb-2">${format(new Date(event.date), 'MMMM d, yyyy')}</div>
                            <div class="text-gray-200">${event.description}</div>
                            ${event.image ? `<img src="${event.image}" class="mt-2 w-16 h-16 object-cover rounded" />` : ''}
                          `;
                          tooltip.style.left = '0';
                          tooltip.style.top = '100%';
                          tooltip.style.marginTop = '4px';
                          e.currentTarget.appendChild(tooltip);
                        }}
                        onMouseLeave={(e) => {
                          const tooltip = e.currentTarget.querySelector('div[class*="absolute z-50"]');
                          if (tooltip) {
                            tooltip.remove();
                          }
                        }}
                      >
                        {event.image ? (
                          <img 
                            src={event.image} 
                            alt={event.title}
                            className="w-4 h-4 object-cover rounded mr-1 inline-block"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span className="mr-1" style={{display: event.image ? 'none' : 'inline'}}>{event.icon}</span>
                        <span className="truncate christmas-font text-xs">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} more
                      </div>
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
