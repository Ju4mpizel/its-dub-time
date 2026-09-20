"use client";

// Conversión exacta de segundos a SMPTE (por defecto a 24 fps, estándar cinematográfico)
function secondsToSMPTE(totalSeconds, fps = 24) {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * fps);

  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
    frames: frames.toString().padStart(2, "0"),
  };
}

export default function TimecodeDisplay({ currentTime = 0, fps = 24 }) {
  const { hours, minutes, seconds, frames } = secondsToSMPTE(currentTime, fps);

  return (
    <div className="flex flex-col items-center bg-black/90 border border-neutral-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md">
      {/* Contenedor del reloj digital estilo hardware / Pro Tools */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 px-4 py-1.5 bg-[#050905] border border-[#163816] rounded-lg shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
        {/* Horas */}
        <div className="flex flex-col items-center">
          <span className="font-mono text-2xl sm:text-4xl font-extrabold text-[#39ff14] tracking-wider drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">
            {hours}
          </span>
          <span className="text-[9px] font-mono tracking-widest text-emerald-600/80 uppercase">
            HRS
          </span>
        </div>

        <span className="font-mono text-2xl sm:text-4xl font-extrabold text-[#39ff14]/70 mb-3 select-none">
          :
        </span>

        {/* Minutos */}
        <div className="flex flex-col items-center">
          <span className="font-mono text-2xl sm:text-4xl font-extrabold text-[#39ff14] tracking-wider drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">
            {minutes}
          </span>
          <span className="text-[9px] font-mono tracking-widest text-emerald-600/80 uppercase">
            MIN
          </span>
        </div>

        <span className="font-mono text-2xl sm:text-4xl font-extrabold text-[#39ff14]/70 mb-3 select-none">
          :
        </span>

        {/* Segundos */}
        <div className="flex flex-col items-center">
          <span className="font-mono text-2xl sm:text-4xl font-extrabold text-[#39ff14] tracking-wider drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">
            {seconds}
          </span>
          <span className="text-[9px] font-mono tracking-widest text-emerald-600/80 uppercase">
            SEC
          </span>
        </div>

        <span className="font-mono text-2xl sm:text-4xl font-extrabold text-[#39ff14]/70 mb-3 select-none">
          :
        </span>

        {/* Cuadros / Frames */}
        <div className="flex flex-col items-center">
          <span className="font-mono text-2xl sm:text-4xl font-extrabold text-[#39ff14] tracking-wider drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">
            {frames}
          </span>
          <span className="text-[9px] font-mono tracking-widest text-emerald-600/80 uppercase">
            FRM ({fps}fps)
          </span>
        </div>
      </div>
    </div>
  );
}
