import type { CustomItemId } from '../game/types';
import { CUSTOM_ITEMS } from '../game/constants';

const capeItems = new Set(['rainbow-cape', 'sun-cape', 'cloud-cape', 'star-cape']);
const wingItems = new Set(['butterfly-wings', 'angel-wings']);
const scarfItems = new Set(['mint-scarf', 'pink-scarf', 'striped-scarf']);
const glassesItems = new Set(['heart-glasses', 'round-glasses']);
const tailItems = new Set(['rainbow-tail']);

const getGenericIcon = (item: CustomItemId) => CUSTOM_ITEMS.find((customItem) => customItem.id === item)?.icon;

export default function Puppy({
  items = [],
  mood = 'happy',
  moving = false,
  jumping = false,
  dashing = false,
  flipped = false,
}: {
  items?: CustomItemId[];
  mood?: 'happy' | 'rest';
  moving?: boolean;
  jumping?: boolean;
  dashing?: boolean;
  flipped?: boolean;
}) {
  const equipped = new Set(items);
  const headItem = items.find((item) => {
    const slot = CUSTOM_ITEMS.find((customItem) => customItem.id === item)?.slot;
    return slot === 'head' || slot === 'badge';
  });
  const genericIcon = headItem ? getGenericIcon(headItem) : undefined;
  const showGenericHeadDeco =
    headItem &&
    genericIcon &&
    !['red-ribbon', 'strawberry-ribbon', 'star-pin'].includes(headItem);
  const capeItem = items.find((item) => capeItems.has(item));
  const wingItem = items.find((item) => wingItems.has(item));
  const scarfItem = items.find((item) => scarfItems.has(item));
  const glassesItem = items.find((item) => glassesItems.has(item));
  const feetItem = items.find((item) => CUSTOM_ITEMS.find((customItem) => customItem.id === item)?.slot === 'feet');
  const rideItem = items.find((item) => CUSTOM_ITEMS.find((customItem) => customItem.id === item)?.slot === 'ride');

  return (
    <div
      className={[
        'puppy',
        `puppy-${mood}`,
        moving ? 'is-moving' : '',
        jumping ? 'is-jumping' : '',
        dashing ? 'is-dashing' : '',
        flipped ? 'is-flipped' : '',
      ].join(' ')}
      aria-label="강아지 몽실이"
    >
      {rideItem && <span className={`puppy-ride ride-${rideItem}`}><i /><b /></span>}
      {capeItem && <span className={`puppy-cape cape-${capeItem}`} />}
      {wingItem && <span className={`puppy-wings wings-${wingItem}`} />}
      <span className="puppy-tail" />
      {items.some((item) => tailItems.has(item)) && <span className="deco deco-rainbow-tail" />}
      <span className="puppy-ear puppy-ear-left" />
      <span className="puppy-ear puppy-ear-right" />
      <span className="puppy-body" />
      <span className="puppy-face">
        <span className="puppy-eye puppy-eye-left" />
        <span className="puppy-eye puppy-eye-right" />
        <span className="puppy-cheek puppy-cheek-left" />
        <span className="puppy-cheek puppy-cheek-right" />
        <span className="puppy-nose" />
        <span className="puppy-mouth" />
      </span>
      <span className="puppy-leg puppy-leg-left" />
      <span className="puppy-leg puppy-leg-right" />
      {feetItem && <><span className={`puppy-shoe shoe-left shoe-${feetItem}`} /><span className={`puppy-shoe shoe-right shoe-${feetItem}`} /></>}
      {equipped.has('red-ribbon') && <span className="deco deco-ribbon" />}
      {equipped.has('strawberry-ribbon') && <span className="deco deco-strawberry">●</span>}
      {equipped.has('heart-necklace') && <span className="deco deco-necklace">♥</span>}
      {equipped.has('star-pin') && <span className="deco deco-star">★</span>}
      {scarfItem && <span className={`deco deco-scarf scarf-${scarfItem}`} />}
      {glassesItem && <span className={`deco deco-glasses glasses-${glassesItem}`}>{glassesItem === 'heart-glasses' ? '♡' : '◎'}</span>}
      {showGenericHeadDeco && <span className={`deco deco-generic deco-${headItem}`}>{genericIcon}</span>}
    </div>
  );
}
