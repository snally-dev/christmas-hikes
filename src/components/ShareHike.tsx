import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { badgeUrl } from "../data/hikes";
import type { AdventureDefinition } from "../types";

async function makeHikeCard(hike: AdventureDefinition): Promise<File> {
  const badge = new Image();
  badge.src = badgeUrl(hike.badge.unlockedImage);
  await badge.decode();

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Card rendering unavailable");

  context.fillStyle = "#073a29";
  context.fillRect(0, 0, 900, 900);
  context.strokeStyle = "#c99a3d";
  context.lineWidth = 4;
  context.strokeRect(26, 26, 848, 848);
  context.textAlign = "center";
  context.fillStyle = "#f2dfaa";
  context.font = "bold 28px system-ui, sans-serif";
  context.fillText("CHRISTMAS HIKES", 450, 105);

  const scale = 540 / Math.max(badge.naturalWidth, badge.naturalHeight);
  const width = badge.naturalWidth * scale;
  const height = badge.naturalHeight * scale;
  context.drawImage(badge, (900 - width) / 2, 410 - height / 2, width, height);
  context.fillStyle = "#fff8e9";
  context.font = "bold 48px Georgia, serif";
  context.fillText(hike.name, 450, 737, 780);
  context.fillStyle = "#f2dfaa";
  context.font = "30px system-ui, sans-serif";
  context.fillText("I earned my hiking badge!", 450, 796, 780);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((image) => {
      if (image) resolve(image);
      else reject(new Error("Card encoding unavailable"));
    }, "image/png");
  });
  return new File([blob], `${hike.slug}-badge.png`, { type: "image/png" });
}

export function ShareHike({ hike }: { hike: AdventureDefinition }) {
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<{ file: File; url: string }>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    let closed = false;
    let url: string | undefined;

    void makeHikeCard(hike)
      .then((file) => {
        if (closed) return;
        url = URL.createObjectURL(file);
        setCard({ file, url });
      })
      .catch(() => {
        if (!closed) setMessage("The badge card couldn't load. Close it and try again.");
      });

    return () => {
      closed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [hike, open]);

  const shareData = card ? { files: [card.file] } : undefined;
  const canShare =
    shareData && typeof navigator.share === "function" && navigator.canShare?.(shareData);

  const share = async () => {
    if (!shareData) return;
    setMessage("");
    try {
      await navigator.share(shareData);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setMessage("The share menu couldn't open. Save the image and add it from Photos.");
      }
    }
  };

  return (
    <div className="share-hike">
      <button
        className="button button--secondary"
        type="button"
        aria-expanded={open}
        aria-controls={`share-${hike.slug}`}
        onClick={() => {
          setCard(undefined);
          setMessage("");
          setOpen(!open);
        }}
      >
        <Share2 aria-hidden="true" /> {open ? "Close badge card" : "Share badge"}
        <span className="visually-hidden"> for {hike.name}</span>
      </button>
      <div id={`share-${hike.slug}`} hidden={!open}>
        {open && card && (
          <div className="share-hike-preview">
            <img src={card.url} alt={`Share card for ${hike.name}`} width={900} height={900} />
            <div>
              <p>
                If Messenger Kids appears in the share menu, choose it. On iPad, you can also touch
                and hold the card to save it to Photos, then attach it in Messenger Kids.
              </p>
              <div className="share-hike-actions">
                {canShare && (
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => void share()}
                  >
                    Share image
                  </button>
                )}
                <a className="button button--secondary" href={card.url} download={card.file.name}>
                  Download image
                </a>
              </div>
            </div>
          </div>
        )}
        <div role="status">{message || (open && !card ? "Preparing your badge card…" : "")}</div>
      </div>
    </div>
  );
}
