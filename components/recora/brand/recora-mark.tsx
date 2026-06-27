type RecoraMarkProps = {
  className?: string;
  reverse?: boolean;
  title?: string;
};

export function RecoraMark({ className, reverse = false, title = "Recora" }: RecoraMarkProps) {
  const mainFill = reverse ? "#FFFFFF" : "#063D31";

  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label={title}>
      <path
        fill={mainFill}
        fillRule="evenodd"
        d="M6 4h20.4C35.5 4 41 9.1 41 17.2c0 5.8-3 10.1-8.6 12.2L43.2 44H31.1l-8.7-12.4H16V44H6V4Zm10 8.1v15.1l5.2-4.6h5.1c3.9 0 6.1-2 6.1-5.4 0-3.3-2.2-5.1-6.1-5.1H16Z"
      />
      <circle cx="26.1" cy="17.3" r="3.15" fill="#A9E12A" />
    </svg>
  );
}
