import { AttackerNp, DefenderNp, NobleAttack, NormalAttack, StarBonus } from '@/base/attack';
import { CardType, ServantClass } from '@/base/enums';
import { ServantBase } from '@/base/servant';

export function classAttackPatch (servantClass:ServantClass):number {
  const matrix = {
    [ ServantClass.saber ]: 1,
    [ ServantClass.archer ]: 0.95,
    [ ServantClass.lancer ]: 1.05,
    [ ServantClass.rider ]: 1,
    [ ServantClass.caster ]: 0.9,
    [ ServantClass.assassin ]: 0.9,
    [ ServantClass.berserker ]: 1.1,
    [ ServantClass.ruler ]: 1.1,
    [ ServantClass.avenger ]: 1.1,
    [ ServantClass.alterego ]: 1,
    [ ServantClass.moonCancer ]: 1,
    [ ServantClass.foreigner ]: 1,
    [ ServantClass.shielder ]: 1,
    [ ServantClass.beast1 ]: 1,
    [ ServantClass.beast2 ]: 1,
    [ ServantClass.beast3L ]: 1,
    [ ServantClass.beast3R ]: 1,
    [ ServantClass.beastUnknown ]: 1,
  };
  return matrix[ servantClass ] || 1;
}

export function restraint (
  attacker:ServantClass,
  defender:ServantClass,
):number {
  const matrix = [
    [ 1, 0.5, 2, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 2, 1, 0.5, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 0.5, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 1, 1, 1, 1, 2, 0.5, 2, 0.5, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0 ],
    [ 1, 1, 1, 0.5, 1, 2, 2, 0.5, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0 ],
    [ 1, 1, 1, 2, 0.5, 1, 2, 0.5, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0 ],
    [ 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 0.5, 1, 1.5, 1, 1, 1, 0 ],
    [ 1, 1, 1, 1, 1, 1, 2, 1, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 0 ],
    [ 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 1, 1, 0 ],
    [ 0.5, 0.5, 0.5, 1.5, 1.5, 1.5, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1.2, 1.2, 0 ],
    [ 1, 1, 1, 1, 1, 1, 2, 0.5, 2, 1, 1, 1, 1, 1, 1, 1.2, 1, 0 ],
    [ 1, 1, 1, 1, 1, 1, 2, 1, 1, 0.5, 1, 2, 1, 1, 1, 1, 1.2, 0 ],
    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 2, 2, 2, 1, 1, 1, 2, 1, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    [ 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
  ];
  return matrix[ attacker ][ defender ];
}

export function hiddenCharacteristicRestraint (
  attacker:hiddenCharacteristic,
  defender:hiddenCharacteristic,
):number {
  const matrix = {
    god: {
      legend: 1.1,
      human: 0.9,
    },
    legend: {
      human: 1.1,
      god: 0.9,
    },
    human: {
      god: 1.1,
      legend: 0.9,
    },
    beast: {
      beast: 1.1,
    },
    star: {},
  };
  // @ts-ignore
  const restraint:number | undefined = matrix[ attacker ][ defender ];
  return restraint === undefined ? 1 : restraint;
}

export function calculationNormalDamage (
  attackInstance:NormalAttack,
  atk:number,
) {
  return (
    atk *
    0.23 *
    (
      attackInstance.moveCardRate *
      (
        1 +
        attackInstance.moveCardPerformance -
        attackInstance.moveCardEndurance
      ) +
      attackInstance.firstBonus
    ) *
    attackInstance.rankSupplement *
    attackInstance.rankRestraint *
    attackInstance.hiddenStatus *
    (
      1 +
      attackInstance.attackPower -
      attackInstance.defencePower -
      attackInstance.specialDefend
    ) *
    (1 + attackInstance.isCritic) *
    (
      1 +
      attackInstance.specialAttack +
      attackInstance.criticPower * attackInstance.isCritic
    ) *
    attackInstance.extraBonus *
    attackInstance.moveCardHitRate *
    attackInstance.random +
    attackInstance.damageAppend -
    attackInstance.defenceAppend +
    attackInstance.busterChainBonus
  );
}

//NP率 * (指令卡补正 * (1 ± 指令卡性能BUFF ∓ 指令卡耐性) + 首位加成) * 敌补正 * (1 ± NP获得量BUFF) * 暴击补正 * Overkill补正
export function calculationAttackerBonusNp (attackNpInstance:AttackerNp) {
  return (
    attackNpInstance.npRate *
    (attackNpInstance.moveCaredBonus *
      (1 +
        attackNpInstance.moveCardPerformance -
        attackNpInstance.moveCardEndurance) +
      attackNpInstance.firstBonus) *
    attackNpInstance.targetBonus *
    (1 + attackNpInstance.NpBonus) *
    attackNpInstance.isCritic *
    attackNpInstance.overKillBonus
  );
}

// 受击NP率 * 敌补正 * (1 ± NP获得量BUFF) * (1 ± 受击NP获得量BUFF) * Overkill补正
export function calculationDefenderBonusNp (defenderNpInstance:DefenderNp) {
  return (
    defenderNpInstance.defenceNpRate *
    defenderNpInstance.attackerNpBonus *
    (1 + defenderNpInstance.defenceNpBonus) *
    defenderNpInstance.overKillBonus
  );
}

//从者掉星率 + 指令卡掉星率 * (1 ± 指令卡性能BUFF ∓ 指令卡耐性) + 首位加成 + 敌补正 ± 掉星率BUFF ± 敌人掉星率BUFF + 暴击补正 + Overkill补正
export function calculationStarBonus (starInstance:StarBonus) {
  let count =
    starInstance.servantStarDropRate +
    starInstance.moveCardStarDropRate *
    (1 + starInstance.moveCardPerformance - starInstance.moveCardEndurance) +
    starInstance.firstBonus +
    starInstance.targetBonus +
    starInstance.starDropRateBuff +
    starInstance.targetStarDropRateBuff +
    starInstance.isCritic +
    starInstance.overKillBonus;
  if (count !== (count | 0)) {
    let dim = count - (count | 0);
    count = (count | 0) + (Math.random() < dim ? 1 : 0);
  }
  return Math.min(3, count);
}

export function moveCardStarDropRate (
  cardType:CardType,
  position:number,
) {
  const matrix = {
    [ CardType.buster ]: [ 0.1, 0.15, 0.2, 0 ],
    [ CardType.art ]: [ 0, 0, 0, 0 ],
    [ CardType.quick ]: [ 0.8, 1.3, 1.8, 0 ],
    [ CardType.extra ]: [ 0, 0, 0, 1 ],
  };
  return matrix[ cardType ][ position ];
}

export function targetStarBonus (targetClass:ServantClass) {
  const matrix = {
    [ ServantClass.saber ]: 0,
    [ ServantClass.archer ]: 0.05,
    [ ServantClass.lancer ]: -0.05,
    [ ServantClass.rider ]: 0.1,
    [ ServantClass.caster ]: 0,
    [ ServantClass.assassin ]: -0.1,
    [ ServantClass.berserker ]: 0,
    [ ServantClass.ruler ]: 0,
    [ ServantClass.avenger ]: -0.1,
    [ ServantClass.alterego ]: 0.05,
    [ ServantClass.moonCancer ]: 0,
    [ ServantClass.foreigner ]: 0.2,
    [ ServantClass.shielder ]: 0,
    [ ServantClass.beast1 ]: 0,
    [ ServantClass.beast2 ]: 0,
    [ ServantClass.beast3L ]: 0,
    [ ServantClass.beast3R ]: 0,
    [ ServantClass.beastUnknown ]: 0,
  };
  return matrix[ targetClass ] || 0;
}

export function targetNpBonus (targetClass:ServantClass) {
  const matrix = {
    [ ServantClass.saber ]: 1,
    [ ServantClass.archer ]: 1,
    [ ServantClass.lancer ]: 1,
    [ ServantClass.rider ]: 1.1,
    [ ServantClass.caster ]: 1.2,
    [ ServantClass.assassin ]: 0.9,
    [ ServantClass.berserker ]: 0.8,
    [ ServantClass.ruler ]: 1,
    [ ServantClass.avenger ]: 1,
    [ ServantClass.alterego ]: 1,
    [ ServantClass.moonCancer ]: 1.2,
    [ ServantClass.foreigner ]: 1,
    [ ServantClass.shielder ]: 1,
    [ ServantClass.beast1 ]: 1,
    [ ServantClass.beast2 ]: 1,
    [ ServantClass.beast3L ]: 1,
    [ ServantClass.beast3R ]: 1,
    [ ServantClass.beastUnknown ]: 1,
  };
  return matrix[ targetClass ] || 1;
}

//(ATK * 0.23 * 宝具伤害倍率 * 指令卡伤害倍率 * (1 ± 指令卡性能BUFF ∓ 指令卡耐性) * 职阶补正 * 职阶克制 * 隐藏属性克制 * (1 ± 攻击力BUFF ∓ 防御力BUFF - 特防状态BUFF) * (1 + 特攻状态加成 ± 宝具威力BUFF) * 宝具特攻倍率 * 随机数) ± 伤害附加与减免 ∓ 被伤害减免与提升
export function calculationNobleDamage (attackInstance:NobleAttack, atk:number) {
  return (atk * 0.23 * attackInstance.nobleRate * attackInstance.moveCardRate * (1 + attackInstance.moveCardPerformance - attackInstance.moveCardEndurance) * attackInstance.rankSupplement * attackInstance.rankRestraint * attackInstance.hiddenStatus * (1 + attackInstance.attackPower - attackInstance.defencePower - attackInstance.specialDefend) * (1 + attackInstance.specialAttack + attackInstance.noblePower) * (attackInstance.nobleSpecialAttack || 1) * attackInstance.random) + attackInstance.damageAppend - attackInstance.defenceAppend;
}

export function performanceAttack (attacker:ServantBase, defender:ServantBase, damage:number, attackerNp:AttackerNp, star:StarBonus, defenderNp:DefenderNp, hitChain:number[]) {
  const total = (hitChain => {
    let t:number = 0;
    for (let i = 0; i < hitChain.length; i++) {
      t += hitChain[ i ];
    }
    return t;
  })(hitChain);
  let stars:number = 0;
  for (let i = 0; i < hitChain.length; i++) {
    defender.hpAdd(-Math.round(damage / total * hitChain[ i ]), false);
    const overKill = defender.hp <= 0;
    attackerNp.overKillBonus = overKill ? 1.5 : 1;
    defenderNp.overKillBonus = overKill ? 1.5 : 1;
    star.overKillBonus = overKill ? 0.3 : 0;
    attacker.addNp(calculationAttackerBonusNp(attackerNp));
    defender.addNp(calculationDefenderBonusNp(defenderNp));
    stars+=calculationStarBonus(star)
  }
  console.log(attacker.name + ' deal ' + damage + ' to ' + defender.name);
  return stars
}
