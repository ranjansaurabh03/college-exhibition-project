import mongoose from 'mongoose'

// One document per counter and day, e.g. { _id: "ai:2026-10-06", count: 42 }.
const usageSchema = new mongoose.Schema({ _id: String, count: { type: Number, default: 0 } }, { versionKey: false })

export default mongoose.model('Usage', usageSchema)
