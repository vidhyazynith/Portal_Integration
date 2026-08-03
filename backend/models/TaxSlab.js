import mongoose from "mongoose";

const taxSlabSchema = new mongoose.Schema(
{
    taxRegimeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaxRegime",
        required: true
    },

    fromAmount: {
        type: Number,
        required: true
    },

    toAmount: {
        type: Number,
        default: null
    },

    percentage: {
        type: Number,
        required: true
    },

    order: {
        type: Number
    },

    active: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

taxSlabSchema.pre("save", async function (next) {

    if (!this.isNew || this.order) {
        return next();
    }

    const TaxSlab = mongoose.model("TaxSlab");

    const lastSlab = await TaxSlab
        .findOne({
            taxRegimeId: this.taxRegimeId
        })
        .sort({ order: -1 });

    this.order = lastSlab
        ? lastSlab.order + 1
        : 1;

    next();
});

taxSlabSchema.index(
    {
        taxRegimeId: 1,
        order: 1
    },
    {
        unique: true
    }
);

export default mongoose.model("TaxSlab", taxSlabSchema);