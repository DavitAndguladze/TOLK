import { createOciChat } from "../comprehension/oci-chat";
import { createWordMeaning } from "./meaning";
import { createOciSpeech } from "./oci-speech";

export const defineWord = createWordMeaning(createOciChat());
export const synthesizeWord = createOciSpeech();
