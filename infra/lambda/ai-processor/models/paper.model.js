import mongoose from "mongoose"

const paperSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true 
    },
    topic: {
        type: [String],
        required: true,
        enum: ["NLP", "Computer Vision", "Reinforcement Learning"],
        validate: {
            validator: function(arr) {
                return arr.length > 0; 
            },
            message: "You must select at least one topic"
        }
    },
    summary: {
        type: String,
        required: [true, "Summary is required"],
        trim: true   
    },
    audioUrl: {
        type: String,
        required: false,
        trim: true
    },
     pdfUrl: { 
        type: String,
        required: false,
        trim: true
    },
    views: {
        type: Number,
        default: 0 
    },
    source: {
      type: String,
      default: "arXiv",
      trim: true,
    },
    externalId: {
      type: String,
      required: true,
      trim: true,
    },
    publishedAt: {
      type: Date,
      required: false,
    },
}, {timestamps: true});

paperSchema.index({ source: 1, externalId: 1 }, { unique: true });

const Paper = mongoose.model("Paper", paperSchema);

export default Paper;