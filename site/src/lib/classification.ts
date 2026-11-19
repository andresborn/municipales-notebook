import { fmtPp } from "./format";

export const CLASSIFICATION_INFO: Record<
  string,
  { className: string; threshold: string }
> = {
  "Muy disputado": {
    className: "badge--hot",
    threshold: "Margen menor a 5 pp",
  },
  Disputado: {
    className: "badge--dark",
    threshold: "Margen entre 5 y 10 pp",
  },
  "Poco disputado": {
    className: "badge--soft",
    threshold: "Margen entre 10 y 20 pp",
  },
  Dominado: {
    className: "",
    threshold: "Margen de 20 pp o más",
  },
};

/** Un margen puede ser positivo y aun así redondear a 0,0 pp. */
export const ppLabel = (value: number, votes: number) =>
  votes > 0 && value < 0.1 ? "<0,1 pp" : fmtPp(value);
