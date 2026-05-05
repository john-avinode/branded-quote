export const sampleQuote = {
  broker: 'Northstar Aviation',
  client: 'Avery Laurent',
  route: 'London Luton to Nice Cote d Azur',
  note:
    'Aircraft below are available for the requested departure window. Final availability is subject to owner approval and crew confirmation.',
  options: [
    {
      id: 'g650',
      title: 'Gulfstream G650ER',
      price: 'EUR 72,800',
      priceNote: 'Total price',
      comment:
        'Best balance of cabin comfort and direct routing. The cabin has a quiet four-zone layout with high-speed connectivity.',
      departureDate: 'Fri, 22 May 2026',
      flightTime: '1h 55m',
      itinerary: [
        { label: 'Depart', airport: 'London Luton', code: 'LTN', time: '10:30' },
        { label: 'Arrive', airport: 'Nice Cote d Azur', code: 'NCE', time: '13:25' }
      ],
      data: [
        ['Year', '2019'],
        ['Interior refurb', '2024'],
        ['Exterior refurb', '2023'],
        ['Seats', '14'],
        ['Range', '7,500 nm']
      ],
      amenities: ['Wi-Fi', 'Full galley', 'Private aft suite', 'Conference table'],
      images: [
        { kind: 'Exterior', tone: 'silver' },
        { kind: 'Cabin', tone: 'cabin' },
        { kind: 'Floorplan', tone: 'plan' }
      ]
    },
    {
      id: 'global6000',
      title: 'Bombardier Global 6000',
      price: 'EUR 68,400',
      priceNote: 'Total price',
      comment: 'Large cabin option with strong luggage capacity and a refreshed cabin finish.',
      departureDate: 'Fri, 22 May 2026',
      flightTime: '2h 00m',
      itinerary: [
        { label: 'Depart', airport: 'London Luton', code: 'LTN', time: '11:45' },
        { label: 'Arrive', airport: 'Nice Cote d Azur', code: 'NCE', time: '14:45' }
      ],
      data: [
        ['Year', '2017'],
        ['Interior refurb', '2022'],
        ['Exterior refurb', '2022'],
        ['Seats', '13'],
        ['Range', '6,000 nm']
      ],
      amenities: ['Wi-Fi', 'Divan seating', 'Enclosed lavatory'],
      images: [
        { kind: 'Exterior', tone: 'dark' },
        { kind: 'Cabin', tone: 'warm' },
        { kind: 'Floorplan', tone: 'plan' }
      ]
    },
    {
      id: 'falcon7x',
      title: 'Dassault Falcon 7X',
      price: 'EUR 61,900',
      priceNote: 'Total price',
      comment: 'Efficient long-range aircraft with a calm cabin and practical baggage access.',
      departureDate: 'Fri, 22 May 2026',
      flightTime: '2h 05m',
      itinerary: [
        { label: 'Depart', airport: 'Farnborough', code: 'FAB', time: '09:15' },
        { label: 'Arrive', airport: 'Nice Cote d Azur', code: 'NCE', time: '12:20' }
      ],
      data: [
        ['Year', '2016'],
        ['Interior refurb', '2021'],
        ['Exterior refurb', '2021'],
        ['Seats', '12'],
        ['Range', '5,950 nm']
      ],
      amenities: ['Wi-Fi', 'Hot catering', 'Forward galley'],
      images: [
        { kind: 'Exterior', tone: 'blue' },
        { kind: 'Cabin', tone: 'cream' }
      ]
    }
  ]
};
