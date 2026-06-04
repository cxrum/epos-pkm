import type { ObjetServiceContract } from "../store/services/objectsContract";
import type { TypingServiceContract } from "../store/services/typingEngineContract";

export interface GlobalDependencies {
   pageService: ObjetServiceContract
   typingService: TypingServiceContract
}