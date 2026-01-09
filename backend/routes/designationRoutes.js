import express from "express";
import { syncDesignationFromHR ,
    getAllDesignations,
    getActiveDesignations,
    getDesignationById

} from "../Controllers/DesignationController.js";
 
const router = express.Router();
 
// 🔐 HR → Finance private sync route
router.post("/add/designation", syncDesignationFromHR);

router.get("/", getAllDesignations);

router.get("/active", getActiveDesignations);

router.get("/:id", getDesignationById);

export default router;