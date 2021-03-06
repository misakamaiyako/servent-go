// (ATK * 0.23 * ((指令卡伤害倍率 * (1 ± 指令卡性能BUFF ∓ 指令卡耐性)) + 首位加成) * 职阶补正 * 职阶克制 * 隐藏属性克制 * (1 ± 攻击力BUFF ∓ 防御力BUFF - 特防状态BUFF) * (1 + 暴击补正) * (1 + 特攻状态加成 ± 暴击威力BUFF * 暴击补正) * Extra攻击加成 * 指令卡Hit倍率 * 随机数) ± 伤害附加与减免 ∓ 被伤害减免与提升 + BusterChain加成
//指令卡伤害倍率,首位加成,隐藏属性克制,暴击补正，Extra攻击加成,BusterChain加成,随机数在生成前计算，常量。在攻击前，所有的值都有默认值
import { ActionType, CardType, ChainType, ServantClass } from '@/base/enums';
import { ServantBase } from '@/base/servant';
import {
  calculationNobleDamage,
  calculationNormalDamage,
  classAttackPatch,
  hiddenCharacteristicRestraint,
  moveCardStarDropRate,
  performanceAttack,
  restraint,
  targetNpBonus,
  targetStarBonus,
} from '@/base/formula';
import MoveCard from '@/base/moveCard';
import Noble from '@/base/noble';

export interface NormalAttack {
  //指令卡伤害倍率
  moveCardRate:number;
  //首位加成
  firstBonus:number;
  //隐藏属性克制
  hiddenStatus:number;
  //暴击补正
  isCritic:0 | 1;
  //随机数
  random:number;
  //Extra攻击加成
  extraBonus:number;
  //指令卡颜色
  moveCardColor:CardType;
  //指令卡性能BUFF
  moveCardPerformance:number;
  //指令卡耐性
  moveCardEndurance:number;
  //职阶补正
  rankSupplement:number;
  //职阶克制
  rankRestraint:number;
  //攻击力BUFF
  attackPower:number;
  //防御力BUFF
  defencePower:number;
  //特防状态BUFF
  specialDefend:number;
  //特攻状态加成
  specialAttack:number;
  //暴击威力BUFF
  criticPower:number;
  //指令卡Hit倍率
  moveCardHitRate:number;
  //伤害值追加
  damageAppend:number;
  //被伤害值追加
  defenceAppend:number;
  //BusterChain加成
  busterChainBonus:number;
}

export interface AttackerNp {
  //NP率
  npRate:number;
  //指令卡补正
  moveCaredBonus:number;
  //指令卡性能BUFF
  moveCardPerformance:number;
  //指令卡耐性
  moveCardEndurance:number;
  //首位加成
  firstBonus:number;
  //敌补正
  targetBonus:number;
  //NP获得量BUFF
  NpBonus:number;
  //暴击补正
  isCritic:number;
  //Overkill补正
  overKillBonus:number;
}

//受击NP率 * 敌补正 * (1 ± NP获得量BUFF) * (1 ± 受击NP获得量BUFF) * Overkill补正
export interface DefenderNp {
  defenceNpRate:number;
  attackerNpBonus:number;
  npBuff:number;
  defenceNpBonus:number;
  overKillBonus:number;
}

//从者掉星率 + 指令卡掉星率 * (1 ± 指令卡性能BUFF ∓ 指令卡耐性) + 首位加成 + 敌补正 ± 掉星率BUFF ± 敌人掉星率BUFF + 暴击补正 + Overkill补正
export interface StarBonus {
  servantStarDropRate:number;
  moveCardStarDropRate:number;
  moveCardPerformance:number;
  moveCardEndurance:number;
  firstBonus:number;
  targetBonus:number;
  starDropRateBuff:number;
  targetStarDropRateBuff:number;
  isCritic:number;
  overKillBonus:number;
}

//(ATK * 0.23 * 宝具伤害倍率 * 指令卡伤害倍率 * (1 ± 指令卡性能BUFF ∓ 指令卡耐性) * 职阶补正 * 职阶克制 * 隐藏属性克制 * (1 ± 攻击力BUFF ∓ 防御力BUFF - 特防状态BUFF) * (1 + 特攻状态加成 ± 宝具威力BUFF) * 宝具特攻倍率 * 随机数) ± 伤害附加与减免 ∓ 被伤害减免与提升

export interface NobleAttack {
  nobleRate:number;
  moveCardRate:number;
  moveCardPerformance:number;
  moveCardEndurance:number;
  rankSupplement:number;
  rankRestraint:number;
  hiddenStatus:number;
  attackPower:number;
  defencePower:number;
  specialDefend:number;
  specialAttack:number;
  noblePower:number;
  nobleSpecialAttack:number;
  random:number;
  damageAppend:number;
  defenceAppend:number;
  moveCardColor:CardType
}


export class Attack {
  attacker:ServantBase;
  attackInstance:{
    rankRestraintFun:any;
    firstBonus:number; busterChainBonus:number; attackPower:number; moveCardRate:number; criticPower:number; moveCardPerformance:number; actionType:ActionType; rankSupplement:number; moveCardHitRate:number; extraBonus:number; ignoresEvasion:boolean; specialAttack:any[]; card:MoveCard; damageAppend:number; pierce:boolean
  };
  attackerNpInstance:Omit<AttackerNp, 'isCritic' | 'overKillBonus' | 'targetBonus' | 'moveCardEndurance'>;
  private readonly starBonus:{ firstBonus:number; actionType:ActionType; servantStarDropRate:number; moveCardStarDropRate:any; starDropRateBuff:number };
  hitChain:Array<number>;

  constructor (servant:ServantBase, card:MoveCard, cardPosition:number, firstCard:CardType, chainType:ChainType) {
    this.attacker = servant;
    if (card.commanderCard) {
      card.commanderCard.active();
    }
    const attack = servant.buffStack.handle({
      actionType: ActionType.attack,
      attackPower: 0,
      card,
      moveCardPerformance: 0,
      criticPower: 0,
      damageAppend: 0,
      specialAttack: [],
      ignoresEvasion: false,
      pierce: false,
      moveCardHitRate: card.hitsRate,
      rankSupplement: classAttackPatch(servant.servantClass),
      moveCardRate: cardPosition === 3
        ? 1
        : card.basePowerRate * (1 + 0.2 * cardPosition),
      extraBonus:
        cardPosition !== 3 ? 1 : chainType === ChainType.buster ? 3.5 : 2,
      busterChainBonus: chainType === ChainType.buster ? this.attacker.atk * 0.2 : 0,
      firstBonus: firstCard === CardType.buster ? 0.5 : 0,
      rankRestraintFun: [],
    });
    attack.attackPower = Math.max(-100, Math.min(500, attack.attackPower));
    attack.moveCardPerformance = Math.max(-100, Math.min(500, attack.moveCardPerformance));
    attack.criticPower = Math.max(-100, Math.min(500, attack.criticPower));
    this.attackInstance = attack;
    this.attackerNpInstance = {
      NpBonus: 0,
      firstBonus: firstCard === CardType.art ? 1 : 0,
      moveCardPerformance: attack.moveCardPerformance,
      moveCaredBonus:
        card.cardType === CardType.buster
          ? 0
          : cardPosition === 3
          ? 1
          : (card.cardType === CardType.art ? 3 : 1) *
          (1 + 0.5 * cardPosition),
      npRate: servant.npType === 'process' ? servant.npRate : 0,
    };
    this.starBonus = servant.buffStack.handle({
      actionType: ActionType.calculateStar,
      firstBonus: firstCard === CardType.quick ? 0.2 : 0,
      moveCardStarDropRate: moveCardStarDropRate(card.cardType, cardPosition),
      servantStarDropRate: servant.starDropRate,
      starDropRateBuff: 0,
    });
    this.hitChain = card.hitsChain;
  }

  attack (target:ServantBase, hitFinish:boolean) {
    let defenceInstance:DefenceInstance&{actionType:ActionType,attacker:ServantBase,card:MoveCard} = target.buffStack.handle({
      actionType: ActionType.defence,
      hiddenStatus: hiddenCharacteristicRestraint(this.attacker.hiddenCharacteristic, target.hiddenCharacteristic),
      rankRestraintFun: [],
      moveCardEndurance: 0,
      specialDefend: 0,
      defencePower: 0,
      defenceAppend: 0,
      evasion: false,//回避
      invincibility: false,//无敌
      solemnDefence: false,//对肃正防御
      criticRateDown: 0,
      attacker: this.attacker,
      card: this.attackInstance.card,
    });
    let rankRestraint:number = 0;
    if (defenceInstance.rankRestraintFun.length > 0) {
      rankRestraint = Math.min(...defenceInstance.rankRestraintFun);
    } else if (this.attackInstance.rankRestraintFun.length > 0) {
      this.attackInstance.rankRestraintFun.forEach((t:(cl:ServantClass)=>number) => {
        rankRestraint = Math.max(t(target.servantClass));
      });
    } else {
      rankRestraint = restraint(this.attacker.servantClass, target.servantClass);
    }
    let attackInstance = this.attackInstance;
    const isCritic:boolean = (attackInstance.card.criticRate - defenceInstance.criticRateDown) > Math.random();
    let damageInstance:NormalAttack = {
      attackPower: attackInstance.attackPower,
      busterChainBonus: this.attackInstance.busterChainBonus,
      criticPower: attackInstance.criticPower,
      damageAppend: attackInstance.damageAppend,
      defenceAppend: defenceInstance.defenceAppend,
      defencePower: defenceInstance.defencePower,
      extraBonus: attackInstance.extraBonus,
      firstBonus: attackInstance.firstBonus,
      hiddenStatus: defenceInstance.hiddenStatus,
      isCritic: isCritic ? 1 : 0,
      moveCardColor: attackInstance.card.cardType,
      moveCardEndurance: defenceInstance.moveCardEndurance,
      moveCardHitRate: attackInstance.card.hitsRate,
      moveCardPerformance: attackInstance.moveCardPerformance,
      moveCardRate: attackInstance.moveCardRate,
      random: 0.9 + Math.random() * 0.2,
      rankRestraint: rankRestraint,
      rankSupplement: attackInstance.rankSupplement,
      specialAttack: (fun => {
        let rate:number = 0;
        for (let funKey in fun) {
          rate += fun[ funKey ](target);
        }
        return rate;
      })(attackInstance.specialAttack),
      specialDefend: defenceInstance.specialDefend,
    };
    let damage:number = 0;
    if (!(defenceInstance.evasion && (!attackInstance.ignoresEvasion && !attackInstance.pierce) || (defenceInstance.invincibility && !attackInstance.pierce) || defenceInstance.solemnDefence)) {
      damage = calculationNormalDamage(damageInstance, this.attacker.atk);
    }
    let starInstance:StarBonus & { actionType:ActionType } = {
      isCritic: isCritic ? 0.2 : 0,
      moveCardEndurance: damageInstance.moveCardEndurance,
      moveCardPerformance: damageInstance.moveCardPerformance,
      overKillBonus: 0,
      targetBonus: targetStarBonus(target.servantClass),
      targetStarDropRateBuff: 0,
      ...this.starBonus,
    };
    let npInstance:AttackerNp & { actionType:ActionType } = {
      actionType: ActionType.attackerBonusNp,
      isCritic: isCritic ? 2 : 1,
      moveCardEndurance: defenceInstance.moveCardEndurance,
      overKillBonus: 0,
      targetBonus: targetNpBonus(target.servantClass) * (target.type === 2 ? 1.2 : 1),
      ...this.attackerNpInstance,
    };
    let defenderNpInstance:DefenderNp & { actionType:ActionType } = {
      actionType: ActionType.defenderBonusNp,
      attackerNpBonus: targetNpBonus(this.attacker.servantClass) * (this.attacker.type === 2 ? 1.2 : 1),
      defenceNpBonus: 0,
      defenceNpRate: target.npType === 'process' ? target.npRate : 0,
      npBuff: 0,
      overKillBonus: 0,
    };
    target.buffStack.handle(starInstance);
    target.buffStack.handle(defenderNpInstance);
    const stars = performanceAttack(this.attacker, target, damage, npInstance, starInstance, defenderNpInstance, this.hitChain);
    target.hpAdd(0, hitFinish);
    return stars;
  }
}

export class NobelActive {
  private readonly nobleInstance;
  private readonly attackerNpInstance:{ firstBonus:number; npRate:number; moveCaredBonus:number; NpBonus:number; moveCardPerformance:number; };
  private readonly starBonus:{ firstBonus:number; actionType:ActionType; servantStarDropRate:number; moveCardStarDropRate:any; starDropRateBuff:number };
  private readonly hitChain:Array<number>;
  private readonly attacker:ServantBase;

  constructor (servant:ServantBase, card:Noble, nobleRate:number) {
    const attack = servant.buffStack.handle({
      actionType: ActionType.noble,
      attackPower: 0,
      damageAppend: 0,
      defenceAppend: 0,
      defencePower: 0,
      moveCardPerformance: 0,
      moveCardRate: card.basePowerRate,
      noblePower: 0,
      nobleRate: nobleRate,
      rankSupplement: classAttackPatch(servant.servantClass),
      nobleSpecialAttack: card.nobleSpecialAttack,
      specialAttack: [],
      ignoresEvasion: false,
      pierce: false,
      card,
      //职阶相性变更
      rankRestraintFun: [],
    });
    attack.attackPower = Math.max(-100, Math.min(500, attack.attackPower));
    attack.moveCardPerformance = Math.max(-100, Math.min(500, attack.moveCardPerformance));
    this.attackerNpInstance = {
      NpBonus: 0,
      firstBonus: 0,
      moveCardPerformance: attack.moveCardPerformance,
      moveCaredBonus:
        card.cardType === CardType.buster
          ? 0
          : (card.cardType === CardType.art ? 3 : 1) *
          (1.5),
      npRate: servant.npType === 'process' ? servant.npRate : 0,
    };
    this.starBonus = servant.buffStack.handle({
      actionType: ActionType.calculateStar,
      firstBonus: 0,
      moveCardStarDropRate: moveCardStarDropRate(card.cardType, 0),
      servantStarDropRate: servant.starDropRate,
      starDropRateBuff: 0,
    });
    this.hitChain = card.hitsChain;
    this.nobleInstance = attack;
    this.attacker = servant;
  }

  attack (target:ServantBase) {
    let defenceInstance:DefenceInstance&{actionType:ActionType,attacker:ServantBase,card:MoveCard} = target.buffStack.handle({
      actionType: ActionType.beNoble,
      hiddenStatus: hiddenCharacteristicRestraint(this.attacker.hiddenCharacteristic, target.hiddenCharacteristic),
      rankRestraintFun: [],
      moveCardEndurance: 0,
      specialDefend: 0,
      defencePower: 0,
      defenceAppend: 0,
      evasion: false,//回避
      invincibility: false,//无敌
      solemnDefence: false,//对肃正防御
      criticRateDown: 0,
      attacker: this.attacker,
      card: this.nobleInstance.card,
    });
    let rankRestraint:number = 0;
    if (defenceInstance.rankRestraintFun.length > 0) {
      rankRestraint = Math.min(...defenceInstance.rankRestraintFun);
    } else if (this.nobleInstance.rankRestraintFun.length > 0) {
      this.nobleInstance.rankRestraintFun.forEach(t => {
        // @ts-ignore
        rankRestraint = Math.max(t(target.servantClass));
      });
    } else {
      rankRestraint = restraint(this.attacker.servantClass, target.servantClass);
    }
    let nobleInstance = this.nobleInstance;
    let damageInstance:NobleAttack = {
      attackPower: nobleInstance.attackPower,
      damageAppend: nobleInstance.damageAppend,
      defenceAppend: defenceInstance.defenceAppend,
      defencePower: defenceInstance.defencePower,
      hiddenStatus: hiddenCharacteristicRestraint(this.attacker.hiddenCharacteristic, target.hiddenCharacteristic),
      moveCardEndurance: defenceInstance.moveCardEndurance,
      moveCardPerformance: nobleInstance.moveCardPerformance,
      moveCardRate: this.nobleInstance.moveCardRate,
      noblePower: nobleInstance.noblePower,
      nobleRate: nobleInstance.nobleRate,
      nobleSpecialAttack: (fun => {
        let rate:number = 0;
        for (let funKey in fun) {
          rate += fun[ funKey ](target);
        }
        return rate;
      })(nobleInstance.nobleSpecialAttack),
      random: 0.9 + Math.random() * 0.2,
      rankRestraint: rankRestraint,
      rankSupplement: nobleInstance.rankSupplement,
      specialAttack: (fun => {
        let rate:number = 0;
        for (let funKey in fun) {
          // @ts-ignore
          rate += fun[ funKey ](target);
        }
        return rate;
      })(nobleInstance.specialAttack),
      specialDefend: defenceInstance.specialDefend,
      moveCardColor:nobleInstance.card.cardType
    };
    let damage:number = 0;
    let attackInstance = this.nobleInstance
    const isCritic = false
    if (!(defenceInstance.evasion && (!attackInstance.ignoresEvasion && !attackInstance.pierce) || (defenceInstance.invincibility && !attackInstance.pierce) || defenceInstance.solemnDefence)) {
      damage = calculationNobleDamage(damageInstance, this.attacker.atk);
    }
    let starInstance:StarBonus & { actionType:ActionType } = {
      isCritic: isCritic ? 0.2 : 0,
      moveCardEndurance: damageInstance.moveCardEndurance,
      moveCardPerformance: damageInstance.moveCardPerformance,
      overKillBonus: 0,
      targetBonus: targetStarBonus(target.servantClass),
      targetStarDropRateBuff: 0,
      ...this.starBonus,
    };
    let npInstance:AttackerNp & { actionType:ActionType } = {
      actionType: ActionType.attackerBonusNp,
      isCritic: isCritic ? 2 : 1,
      moveCardEndurance: defenceInstance.moveCardEndurance,
      overKillBonus: 0,
      targetBonus: targetNpBonus(target.servantClass) * (target.type === 2 ? 1.2 : 1),
      ...this.attackerNpInstance,
    };
    let defenderNpInstance:DefenderNp & { actionType:ActionType } = {
      actionType: ActionType.defenderBonusNp,
      attackerNpBonus: targetNpBonus(this.attacker.servantClass) * (this.attacker.type === 2 ? 1.2 : 1),
      defenceNpBonus: 0,
      defenceNpRate: target.npType === 'process' ? target.npRate : 0,
      npBuff: 0,
      overKillBonus: 0,
    };
    target.buffStack.handle(starInstance);
    target.buffStack.handle(defenderNpInstance);
    const stars = performanceAttack(this.attacker, target, damage, npInstance, starInstance, defenderNpInstance, this.hitChain);
    target.hpAdd(0, true);
    return stars;
  }
}
