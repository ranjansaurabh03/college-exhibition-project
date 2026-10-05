import mongoose from 'mongoose'

const { Mixed } = mongoose.Schema.Types

// Stage data is stored as flexible sub-documents that mirror the front-end model,
// so the shape can evolve without migrations (MongoDB's flexible schema).
const projectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    ideation: { type: Mixed, default: {} },
    validation: { type: Mixed, default: {} },
    scoping: { type: Mixed, default: {} },
    building: { type: Mixed, default: {} },
    chat: { type: Mixed, default: {} },
  },
  {
    timestamps: true,
    minimize: false,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = String(ret._id)
        delete ret._id
        delete ret.userId
        return ret
      },
    },
  },
)

// The dashboard lists a user's projects, newest first.
projectSchema.index({ userId: 1, updatedAt: -1 })

export const STAGE_FIELDS = ['ideation', 'validation', 'scoping', 'building', 'chat']

export default mongoose.model('Project', projectSchema)
