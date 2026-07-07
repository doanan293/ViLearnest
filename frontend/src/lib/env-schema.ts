import { z } from "zod";

export const arcjetModeSchema = z.enum(["LIVE", "DRY_RUN"]);
