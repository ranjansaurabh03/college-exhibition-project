import mongoose from 'mongoose'

const { Mixed } = mongoose.Schema.Types

export const STAGE_FIELDS = ['ideation', 'validation', 'scoping', 'building', 'chat', 'aiChat']

// Stage data is stored as flexible sub-documents that mirror the front-end model,
// so the shape can evolve without migrations (MongoDB's flexible schema).
const projectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The id the browser gave the project, so the same project syncs across devices.
    clientId: { type: String, required: true, match: /^[\w-]{1,64}$/ },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    isDemo: { type: Boolean, default: false },
    // Timestamps from the editing device, used for last-write-wins sync.
    clientCreatedAt: { type: Number, default: () => Date.now() },
    clientUpdatedAt: { type: Number, default: () => Date.now() },
    ideation: { type: Mixed, default: {} },
    validation: { type: Mixed, default: {} },
    scoping: { type: Mixed, default: {} },
    building: { type: Mixed, default: {} },
    chat: { type: Mixed, default: {} },
    aiChat: { type: Mixed, default: {} },
  },
  {
    timestamps: true,
    minimize: false,
    versionKey: false,
    toJSON: {
      // Same shape as the front-end Project type.
      transform(_doc, ret) {
        return {
          id: ret.clientId,
          name: ret.name,
          isDemo: ret.isDemo,
          createdAt: ret.clientCreatedAt,
          updatedAt: ret.clientUpdatedAt,
          savedAt: ret.updatedAt,
          ideation: ret.ideation,
          validation: ret.validation,
          scoping: ret.scoping,
          building: ret.building,
          chat: ret.chat,
          aiChat: ret.aiChat,
        }
      },
    },
  },
)

projectSchema.index({ userId: 1, clientId: 1 }, { unique: true })
// The dashboard lists a user's projects, most recently edited first.
projectSchema.index({ userId: 1, clientUpdatedAt: -1 })

export default mongoose.model('Project', projectSchema)
