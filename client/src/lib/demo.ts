import { newProject } from './factory'
import type { Project } from './types'

export const DEMO_ID = 'demo-canteenq'

/** A filled-in example that walks through all four stages, for live demos. */
export function demoProject(): Project {
  const base = newProject('CanteenQ (demo)')
  return {
    ...base,
    id: DEMO_ID,
    isDemo: true,
    ideation: {
      rawIdea: 'An app for students so they don’t waste so much time in the canteen.',
      productName: 'CanteenQ',
      targetUser: 'Hostel students at our engineering college who have back-to-back lab sessions',
      userContext: 'The 20-minute gap between morning labs and afternoon lectures, when the canteen queue is longest',
      pain: 'They either skip lunch or walk into the next lab late, because the canteen queue takes 15–25 minutes at peak time.',
      frequency: 'daily',
      severity: 4,
      currentSolution: 'Ask a friend to stand in the queue, carry biscuits from the hostel, or skip lunch entirely.',
      alternatives: 'Zomato / Swiggy: they don’t deliver inside the campus\nCanteen WhatsApp group: orders get lost and nobody confirms',
      differentiator:
        'Students pre-order from the canteen’s live menu and collect from a dedicated pickup counter with a token, so no delivery and no queue.',
      whyNow: 'The canteen already accepts UPI, and this semester the timetable squeezed lunch into a single 20-minute slot.',
      willingnessToPay: 'maybe',
      outcome: 'get lunch between back-to-back labs',
      approach: 'letting them pre-order from the live canteen menu and pick up in under two minutes',
    },
    validation: {
      landing: { headline: '', subheadline: '', cta: '' },
      signals: {
        visitors: 240,
        signups: 61,
        outreachSent: 40,
        replies: 14,
        calls: 6,
        surveyResponses: 52,
        veryDisappointed: 23,
        preorders: 9,
      },
      responses: [
        'When can I start using it? Lab 3 ends at 12:50 and I never get lunch.',
        'Sounds cool, all the best!',
        'I’d pay ₹10 extra if it saves me the queue.',
        'Nice idea bro',
        'Can my roommate order for me too?',
        'Not sure the canteen staff will follow the pickup tokens during rush hour.',
        'Interesting, let me know when it’s ready.',
        'I already skip lunch twice a week because of this, please build it.',
      ].join('\n'),
    },
    scoping: {
      features: [
        { id: 'f1', name: 'Login with college email', pays: 'no', core: 'yes', effort: 'S' },
        { id: 'f2', name: 'Live canteen menu', pays: 'yes', core: 'yes', effort: 'M' },
        { id: 'f3', name: 'Pre-order with UPI payment', pays: 'yes', core: 'yes', effort: 'M' },
        { id: 'f4', name: 'Pickup token + “order ready” alert', pays: 'yes', core: 'yes', effort: 'S' },
        { id: 'f5', name: 'Canteen staff order dashboard', pays: 'no', core: 'yes', effort: 'M' },
        { id: 'f6', name: 'Group orders for friends', pays: 'yes', core: 'no', effort: 'L' },
        { id: 'f7', name: 'Loyalty points', pays: 'no', core: 'no', effort: 'M' },
        { id: 'f8', name: 'Ratings and reviews', pays: 'no', core: 'no', effort: 'S' },
        { id: 'f9', name: 'AI meal recommendations', pays: 'no', core: 'no', effort: 'L' },
        { id: 'f10', name: 'Dark mode', pays: 'no', core: 'no', effort: 'S' },
      ],
      coreFlow: [
        'Student logs in with college email',
        'Picks items from today’s menu',
        'Pays with UPI',
        'Gets a pickup token and ready time',
        'Collects food at the pickup counter',
      ],
      outcome: 'Lunch in hand within two minutes of reaching the canteen',
      weeksTarget: 3,
      hoursPerWeek: 25,
    },
    building: {
      entityName: 'Order',
      fields: [
        { id: 'b1', name: 'items', type: 'String', required: true },
        { id: 'b2', name: 'totalAmount', type: 'Number', required: true },
        { id: 'b3', name: 'pickupTime', type: 'Date', required: true },
        { id: 'b4', name: 'token', type: 'String', required: false },
        { id: 'b5', name: 'isReady', type: 'Boolean', required: false },
      ],
    },
  }
}
