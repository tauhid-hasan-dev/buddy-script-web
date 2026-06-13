"use client";

import { useRef, useState } from "react";

import { ApiError } from "@/lib/api";
import { createPost, type Post, type Visibility } from "@/lib/posts";
import { fullName } from "@/lib/format";
import type { AuthUser } from "@/lib/auth";

function PhotoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20">
      <path fill="#666" d="M13.916 0c3.109 0 5.18 2.429 5.18 5.914v8.17c0 3.486-2.072 5.916-5.18 5.916H5.999C2.89 20 .827 17.572.827 14.085v-8.17C.827 2.43 2.897 0 6 0h7.917zm0 1.504H5.999c-2.321 0-3.799 1.735-3.799 4.41v8.17c0 2.68 1.472 4.412 3.799 4.412h7.917c2.328 0 3.807-1.734 3.807-4.411v-8.17c0-2.678-1.478-4.411-3.807-4.411zm.65 8.68l.12.125 1.9 2.147a.803.803 0 01-.016 1.063.642.642 0 01-.894.058l-.076-.074-1.9-2.148a.806.806 0 00-1.205-.028l-.074.087-2.04 2.717c-.722.963-2.02 1.066-2.86.26l-.111-.116-.814-.91a.562.562 0 00-.793-.07l-.075.073-1.4 1.617a.645.645 0 01-.97.029.805.805 0 01-.09-.977l.064-.086 1.4-1.617c.736-.852 1.95-.897 2.734-.137l.114.12.81.905a.587.587 0 00.861.033l.07-.078 2.04-2.718c.81-1.08 2.27-1.19 3.205-.275zM6.831 4.64c1.265 0 2.292 1.125 2.292 2.51 0 1.386-1.027 2.511-2.292 2.511S4.54 8.537 4.54 7.152c0-1.386 1.026-2.51 2.291-2.51zm0 1.504c-.507 0-.918.451-.918 1.007 0 .555.411 1.006.918 1.006.507 0 .919-.451.919-1.006 0-.556-.412-1.007-.919-1.007z"/>
    </svg>
  );
}

function PostButton({
  onClick,
  pending,
  disabled,
}: {
  onClick: () => void;
  pending: boolean;
  disabled: boolean;
}) {
  return (
    <div className="_feed_inner_text_area_btn">
      <button
        type="button"
        className="_feed_inner_text_area_btn_link"
        onClick={onClick}
        disabled={pending || disabled}
        aria-busy={pending}
      >
        <svg className="_mar_img" xmlns="http://www.w3.org/2000/svg" width="14" height="13" fill="none" viewBox="0 0 14 13">
          <path fill="#fff" fillRule="evenodd" d="M6.37 7.879l2.438 3.955a.335.335 0 00.34.162c.068-.01.23-.05.289-.247l3.049-10.297a.348.348 0 00-.09-.35.341.341 0 00-.34-.088L1.75 4.03a.34.34 0 00-.247.289.343.343 0 00.16.347L5.666 7.17 9.2 3.597a.5.5 0 01.712.703L6.37 7.88zM9.097 13c-.464 0-.89-.236-1.14-.641L5.372 8.165l-4.237-2.65a1.336 1.336 0 01-.622-1.331c.074-.536.441-.96.957-1.112L11.774.054a1.347 1.347 0 011.67 1.682l-3.05 10.296A1.332 1.332 0 019.098 13z" clipRule="evenodd" />
        </svg>{" "}
        <span>{pending ? "Posting…" : "Post"}</span>
      </button>
    </div>
  );
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function CreatePost({
  currentUser,
  onCreated,
}: {
  currentUser: AuthUser | null;
  onCreated: (post: Post) => void;
}) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickImage(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setImage(null);
      setPreviewUrl(null);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be at most 5MB.");
      setImage(null);
      setPreviewUrl(null);
      return;
    }
    setError(null);
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed || pending) {
      if (!trimmed) setError("Write something before posting.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { post } = await createPost({ content: trimmed, visibility, image });
      onCreated(post);
      // Reset the composer.
      setContent("");
      setVisibility("PUBLIC");
      pickImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(
        apiError?.fieldErrors.content ??
          apiError?.message ??
          "Couldn't publish your post. Please try again."
      );
    } finally {
      setPending(false);
    }
  }

  const canPost = content.trim().length > 0;

  return (
    <div className="_feed_inner_text_area  _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
      <div className="_feed_inner_text_area_box">
        <div className="_feed_inner_text_area_box_image">
          <img src="/assets/images/txt_img.png" alt={currentUser ? fullName(currentUser) : ""} className="_txt_img" />
        </div>
        <div className="form-floating _feed_inner_text_area_box_form ">
          <textarea
            className="form-control _textarea"
            placeholder="Write something ..."
            id="floatingTextarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          ></textarea>
          <label className="_feed_textarea_label" htmlFor="floatingTextarea">
            Write something ...
            <svg xmlns="http://www.w3.org/2000/svg" width="23" height="24" fill="none" viewBox="0 0 23 24">
              <path fill="#666" d="M19.504 19.209c.332 0 .601.289.601.646 0 .326-.226.596-.52.64l-.081.005h-6.276c-.332 0-.602-.289-.602-.645 0-.327.227-.597.52-.64l.082-.006h6.276zM13.4 4.417c1.139-1.223 2.986-1.223 4.125 0l1.182 1.268c1.14 1.223 1.14 3.205 0 4.427L9.82 19.649a2.619 2.619 0 01-1.916.85h-3.64c-.337 0-.61-.298-.6-.66l.09-3.941a3.019 3.019 0 01.794-1.982l8.852-9.5zm-.688 2.562l-7.313 7.85a1.68 1.68 0 00-.441 1.101l-.077 3.278h3.023c.356 0 .698-.133.968-.376l.098-.096 7.35-7.887-3.608-3.87zm3.962-1.65a1.633 1.633 0 00-2.423 0l-.688.737 3.606 3.87.688-.737c.631-.678.666-1.755.105-2.477l-.105-.124-1.183-1.268z" />
            </svg>
          </label>
        </div>
      </div>

      {error && (
        <p style={{ color: "#d00", fontSize: 13, margin: "8px 0 0" }} role="alert">
          {error}
        </p>
      )}

      {previewUrl && (
        <div style={{ position: "relative", marginTop: 14, display: "inline-block" }}>
          <img
            src={previewUrl}
            alt="Selected"
            style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8 }}
          />
          <button
            type="button"
            onClick={() => {
              pickImage(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            aria-label="Remove image"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(event) => pickImage(event.target.files?.[0] ?? null)}
      />

      {/* For Desktop */}
      <div className="_feed_inner_text_area_bottom">
        <div className="_feed_inner_text_area_item">
          <div className="_feed_inner_text_area_bottom_photo _feed_common">
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
              onClick={() => fileInputRef.current?.click()}
            >
              {" "}
              <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img"><PhotoIcon /></span>
              Photo
            </button>
          </div>
          <div className="_feed_inner_text_area_bottom_event _feed_common">
            <label
              className="_feed_inner_text_area_bottom_photo_link"
              style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                <path stroke="#666" strokeWidth="1.3" d="M9 16.5A7.5 7.5 0 109 1.5a7.5 7.5 0 000 15z" />
                {visibility === "PRIVATE" ? (
                  <path stroke="#666" strokeWidth="1.3" strokeLinecap="round" d="M6 9l2 2 4-4" />
                ) : (
                  <path stroke="#666" strokeWidth="1.3" strokeLinecap="round" d="M9 5.5V9l2.5 1.5" />
                )}
              </svg>
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as Visibility)}
                style={{ border: "none", background: "transparent", color: "#666", cursor: "pointer", outline: "none" }}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </label>
          </div>
        </div>
        <PostButton onClick={submit} pending={pending} disabled={!canPost} />
      </div>
      {/* For Desktop */}

      {/* For Mobile */}
      <div className="_feed_inner_text_area_bottom_mobile">
        <div className="_feed_inner_text_mobile">
          <div className="_feed_inner_text_area_item">
            <div className="_feed_inner_text_area_bottom_photo _feed_common">
              <button
                type="button"
                className="_feed_inner_text_area_bottom_photo_link"
                onClick={() => fileInputRef.current?.click()}
              >
                {" "}
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img"><PhotoIcon /></span>
              </button>
            </div>
            <div className="_feed_inner_text_area_bottom_event _feed_common">
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as Visibility)}
                style={{ border: "none", background: "transparent", color: "#666", cursor: "pointer", outline: "none" }}
                aria-label="Post visibility"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>
          <PostButton onClick={submit} pending={pending} disabled={!canPost} />
        </div>
      </div>
      {/* For Mobile */}
    </div>
  );
}
