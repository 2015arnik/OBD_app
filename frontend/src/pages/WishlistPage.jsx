import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";
import { formatMoney } from "../lib/format";

const newGiftInitialState = {
  title: "",
  description: "",
  url: "",
  price: ""
};

function GiftEditor({ gift, onDelete, onSave }) {
  const [draft, setDraft] = useState({
    title: gift.title || "",
    description: gift.description || "",
    url: gift.url || "",
    price: gift.price || "",
    status: gift.status || "WANTED"
  });
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    await onSave(gift.id, {
      ...draft,
      price: draft.price === "" ? null : Number(draft.price)
    });
    setPending(false);
  };

  return (
    <form className="gift-editor" onSubmit={submit}>
      <div className="gift-card-top">
        <div>
          <input
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
          <textarea
            rows="3"
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Почему именно этот подарок?"
          />
        </div>
        <StatusBadge status={draft.status} />
      </div>

      <div className="gift-form-grid">
        <label>
          Ссылка
          <input
            value={draft.url}
            onChange={(event) =>
              setDraft((current) => ({ ...current, url: event.target.value }))
            }
            placeholder="https://..."
          />
        </label>
        <label>
          Цена
          <input
            type="number"
            min="0"
            value={draft.price}
            onChange={(event) =>
              setDraft((current) => ({ ...current, price: event.target.value }))
            }
          />
        </label>
        <label>
          Статус
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="WANTED">Хочу получить</option>
            <option value="RESERVED">Зарезервирован</option>
            <option value="BOUGHT">Куплен</option>
          </select>
        </label>
      </div>

      <div className="card-actions">
        <button type="submit" className="button button-primary" disabled={pending}>
          {pending ? "Сохраняем..." : "Сохранить"}
        </button>
        <button type="button" className="button button-ghost" onClick={() => onDelete(gift.id)}>
          Удалить
        </button>
      </div>
    </form>
  );
}

export default function WishlistPage() {
  const { user } = useAuth();
  const [giftForm, setGiftForm] = useState(newGiftInitialState);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const loadGifts = async () => {
      try {
        const response = await api.get(`/users/${user.id}/gifts`);
        setGifts(response.data);
      } catch (requestError) {
        setFeedback(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadGifts();
  }, [user.id]);

  const addGift = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post("/gifts", {
        ...giftForm,
        price: giftForm.price === "" ? null : Number(giftForm.price)
      });
      setGifts((current) => [response.data, ...current]);
      setGiftForm(newGiftInitialState);
      setCreateOpen(false);
      setFeedback("Подарок добавлен в вишлист.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const saveGift = async (giftId, payload) => {
    try {
      const response = await api.patch(`/gifts/${giftId}`, payload);
      setGifts((current) =>
        current.map((gift) => (gift.id === giftId ? response.data : gift))
      );
      setFeedback("Подарок обновлён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteGift = async (giftId) => {
    try {
      await api.delete(`/gifts/${giftId}`);
      setGifts((current) => current.filter((gift) => gift.id !== giftId));
      setFeedback("Подарок удалён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="Мой вишлист" />

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}

      <section className="panel">
        <div className="section-title">
          <div>
            <h3>Текущий список подарков</h3>
            <p className="microcopy">Друзья видят этот список в вашей карточке.</p>
          </div>
          <span className="day-pill">{loading ? "..." : `${gifts.length} позиций`}</span>
        </div>

        <div className="wishlist-create-actions wishlist-create-actions-top">
          <button
            type="button"
            className="button button-primary wishlist-add-trigger"
            aria-label={createOpen ? "Скрыть создание подарка" : "Добавить подарок"}
            onClick={() => setCreateOpen((current) => !current)}
          >
            {createOpen ? "×" : "+"}
          </button>
        </div>

        {createOpen ? (
          <form className="panel form-stack wishlist-create-panel" onSubmit={addGift}>
            <div className="section-title">
              <h3>Добавить подарок</h3>
            </div>

            <label>
              Название
              <input
                required
                value={giftForm.title}
                onChange={(event) =>
                  setGiftForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>

            <label>
              Описание
              <textarea
                rows="4"
                value={giftForm.description}
                onChange={(event) =>
                  setGiftForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Ссылка
              <input
                value={giftForm.url}
                onChange={(event) =>
                  setGiftForm((current) => ({ ...current, url: event.target.value }))
                }
              />
            </label>

            <label>
              Цена
              <input
                type="number"
                min="0"
                value={giftForm.price}
                onChange={(event) =>
                  setGiftForm((current) => ({ ...current, price: event.target.value }))
                }
              />
            </label>

            <div className="card-actions">
              <button type="submit" className="button button-primary">
                Добавить в список
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setCreateOpen(false)}
              >
                Скрыть
              </button>
            </div>
          </form>
        ) : null}

        {loading ? <p className="microcopy">Загружаем ваш вишлист...</p> : null}

        <div className="gift-list">
          {gifts.map((gift) => (
            <article key={gift.id} className="gift-card">
              <div className="gift-card-top">
                <div>
                  <h4>{gift.title}</h4>
                  <p>{gift.description || "Описание пока не добавлено."}</p>
                </div>
                <StatusBadge status={gift.status} />
              </div>
              <div className="gift-meta">
                <span>{formatMoney(gift.price)}</span>
                {gift.url ? (
                  <a href={gift.url} target="_blank" rel="noreferrer">
                    Открыть ссылку
                  </a>
                ) : (
                  <span>Ссылка не указана</span>
                )}
              </div>

              <GiftEditor gift={gift} onDelete={deleteGift} onSave={saveGift} />
            </article>
          ))}
        </div>
      </section>

      <div className="cluster">
        <Link className="button button-ghost" to="/profile">
          Редактировать профиль
        </Link>
      </div>
    </div>
  );
}
