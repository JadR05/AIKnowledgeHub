import mongoose from "mongoose"

const subscriptionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "User Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, "Please fill a valid email address"]
    },
    subscribedTopics: {
        type: [String],
        required: [true, "At least one topic must be selected"],
        enum: ["NLP", "Computer Vision", "Reinforcement Learning"],
        validate: {
            validator: function(arr) {
                return arr.length > 0;
            },
            message: "You must select at least one topic"
        }   
    },
    lastEmailSent: {
        type: Date,
        default: null   
    }
}, {timestamps: true});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;