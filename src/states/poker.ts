import * as Assets from '../assets';
import Card from '../utils/card';
import CardEvalObject from '../utils/card';
let Ranker = require('handranker');
export enum OmahaHi {
    PLAYER = 0,
    OPPONENT = 1,
}

export enum STAGE {
    INITDEAL = 0,
    BET = 1,
    FLOP = 2,
    RIVER = 3,
    TURN = 4,
    EVAL = 5,
    STARTROUND = 6,
    RESTARTROUND = 7,
}
export default class Poker extends Phaser.State {
    static STAGE = STAGE;
    static OmahaHi = OmahaHi;
    //  Utils
    private math = null;

    private currentStage = 0;
    private blind = 10;
    private bet = this.blind;
    private raise = false;
    private raisedAmount = 0;
    private oldBet = 0;
    private betCount = 0;
    private turn = OmahaHi.PLAYER;

    //  Player Info
    private hand: Card[];
    private playerBank = null;
    //  Opponet Info
    private opponentHand: Card[];
    private opponentBank = 1000;
    private opponentRaise = false;

    //  Community
    private community: Card[];
    private pot = 0;
    //  Start group
    private startGroup: Phaser.Group = null;
    private playButton: Phaser.Button = null;
    private blindText: Phaser.Text = null;

    //  Status group
    private statusGroup: Phaser.Group = null;
    private statusText: Phaser.Text = null;
    private oldStatusText = ' ';
    //  Play Group
    private playGroup: Phaser.Group = null;
    private opponetText: Phaser.Text = null;
    private playerText: Phaser.Text = null;
    private potText: Phaser.Text = null;

    //  Card group
    private cardGroup: Phaser.Group = null;

    //  Bet group
    private betGroup: Phaser.Group = null;
    private callButton: Phaser.Button = null;
    private foldButton: Phaser.Button = null;
    private raiseButton: Phaser.Button = null;
    private checkButton: Phaser.Button = null;

    //  Player Raise group
    private playerRaiseGroup: Phaser.Group = null;
    private rUpButton: Phaser.Button = null;
    private rDownButton: Phaser.Button = null;
    private raiseAmount: Phaser.Text = null;
    private rButton: Phaser.Button = null;

    private moneyText: Phaser.Text = null;
    private deck = null;
    private localFontText: Phaser.Text = null;
    public preload(): void {
        //  Load any assets you need for your preloader state here.
        this.game.load.atlasJSONArray(Assets.Atlases.AtlasesPreloadSpritesArray.getName(), Assets.Atlases.AtlasesPreloadSpritesArray.getPNG(), Assets.Atlases.AtlasesPreloadSpritesArray.getJSONArray());
        this.game.load.atlasJSONArray(Assets.Atlases.AtlasesButtonsArray.getName(), Assets.Atlases.AtlasesButtonsArray.getPNG(), Assets.Atlases.AtlasesButtonsArray.getJSONArray());
        this.game.load.atlasJSONArray(Assets.Atlases.AtlasesCardsArray.getName(), Assets.Atlases.AtlasesCardsArray.getPNG(), Assets.Atlases.AtlasesCardsArray.getJSONArray());
        this.playerBank = localStorage.getItem('playerBank');
        if(this.playerBank  === null) {
          // If there is no highScore (game is started for the first time on this device)
          this.playerBank = 1000;
          localStorage.setItem('playerBank', this.playerBank.toString());
        } else {
          this.playerBank = +this.playerBank;
        }

        //  this.game.load.atlasJSONHash(Assets.Atlases.AtlasesPreloadSpritesHash.getName(), Assets.Atlases.AtlasesPreloadSpritesHash.getPNG(), Assets.Atlases.AtlasesPreloadSpritesHash.getJSONHash());
        //  this.game.load.atlasXML(Assets.Atlases.AtlasesPreloadSpritesXml.getName(), Assets.Atlases.AtlasesPreloadSpritesXml.getPNG(), Assets.Atlases.AtlasesPreloadSpritesXml.getXML());
    }

    public create(): void {
        this.game.stage.backgroundColor = '#146105';
        //  utils
        this.math = this.game.math;

        //  startGroup
        this.startGroup = this.add.group();
        this.blindText = this.add.text(0, 0, 'Player Bank $' +this.playerBank, { font: 'bold 48px Arial', fill: '#fff', boundsAlignH: 'center', boundsAlignV: 'top' }, this.startGroup);
        this.blindText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.blindText.setTextBounds(0, 0, 960, 600);

        this.playButton = this.add.button(this.world.centerX, 480, 'buttons_array', this.clickPlay, this, Assets.Atlases.AtlasesButtonsArray.Frames.PlayOver, Assets.Atlases.AtlasesButtonsArray.Frames.PlayOut, null, null, this.startGroup);
        this.playButton.anchor.x = 0.5;

        //  playGroup
        this.playGroup = this.add.group();
        this.opponetText = this.add.text(0, 0, 'Opponent', { font: 'bold 24px Arial', fill: '#fff', boundsAlignH: 'right', boundsAlignV: 'top' }, this.playGroup);
        this.opponetText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.opponetText.setTextBounds(480, 50, 475, 10);

        this.playerText = this.add.text(0, 0, 'Your Stack: $', { font: 'bold 24px Arial', fill: '#fff', boundsAlignH: 'right', boundsAlignV: 'top' }, this.playGroup);
        this.playerText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.playerText.setTextBounds(480, 270, 475, 10);

        this.potText = this.add.text(0, 0, 'Pot: $', { font: 'bold 24px Arial', fill: '#fff', boundsAlignH: 'right', boundsAlignV: 'top' }, this.playGroup);
        this.potText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.potText.setTextBounds(480, 80, 475, 10);
        this.playGroup.visible = false;
        //  cardGroup
        this.cardGroup = this.add.group();
        this.cardGroup.scale.set(0.50);

        //  Game Status textType
        this.statusGroup = this.add.group();
        this.statusText = this.add.text(0, 0, 'Blinds are $10.', { font: '30px ' +Assets.CustomWebFonts.FontsParagraph.getFamily(), fill: '#FFF', boundsAlignH: 'center', boundsAlignV: 'center' }, this.statusGroup);
        this.statusText.setTextBounds(0, 450, 960, 10);
        this.statusGroup.visible = false;

        //  betGroup
        this.betGroup =  this.add.group();
        this.callButton = this.add.button(150, 530, 'buttons_array', this.clickCallBet, this, Assets.Atlases.AtlasesButtonsArray.Frames.CallOver, Assets.Atlases.AtlasesButtonsArray.Frames.CallDownOut, null, null, this.betGroup);
        this.callButton.anchor.x = 0.5;
        this.foldButton = this.add.button(400, 530, 'buttons_array', this.clickFoldBet, this, Assets.Atlases.AtlasesButtonsArray.Frames.FoldOver, Assets.Atlases.AtlasesButtonsArray.Frames.FoldOut, null, null, this.betGroup);
        this.foldButton.anchor.x = 0.5;
        this.raiseButton = this.add.button(650, 530, 'buttons_array', this.clickRaiseBet, this, Assets.Atlases.AtlasesButtonsArray.Frames.RaiseOver, Assets.Atlases.AtlasesButtonsArray.Frames.RaiseOut, null, null, this.betGroup);
        this.raiseButton.anchor.x = 0.5;
        this.checkButton = this.add.button(900, 530, 'buttons_array', this.clickCheckBet, this, Assets.Atlases.AtlasesButtonsArray.Frames.CheckOver, Assets.Atlases.AtlasesButtonsArray.Frames.CheckOut, null, null, this.betGroup);
        this.checkButton.anchor.x = 0.5;
        this.betGroup.visible = false;

        //  raiseGroup
        this.playerRaiseGroup = this.add.group();

        this.rUpButton = this.add.button(this.world.centerX, 200, 'buttons_array', this.clickUpRaise, this, Assets.Atlases.AtlasesButtonsArray.Frames.Up, Assets.Atlases.AtlasesButtonsArray.Frames.Up, null, null, this.playerRaiseGroup);
        this.rUpButton.anchor.x = 0.5;
        this.rDownButton = this.add.button(this.world.centerX, 350, 'buttons_array', this.clickDownRaise, this, Assets.Atlases.AtlasesButtonsArray.Frames.Down, Assets.Atlases.AtlasesButtonsArray.Frames.Down, null, null, this.playerRaiseGroup);
        this.rDownButton.anchor.x = 0.5;

        this.raiseAmount = this.add.text(0, 0, '$'+this.bet, { font: 'bold 40px Arial', fill: '#fff', boundsAlignH: 'center', boundsAlignV: 'middle' }, this.playerRaiseGroup);
        this.raiseAmount.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 2);
        this.raiseAmount.setTextBounds(0,0,960,600);

        this.rButton = this.add.button(this.world.centerX, 480, 'buttons_array', this.clickBet, this, Assets.Atlases.AtlasesButtonsArray.Frames.BetOver, Assets.Atlases.AtlasesButtonsArray.Frames.BetOut, null, null, this.playerRaiseGroup);
        this.rButton.anchor.x = 0.5;
        this.playerRaiseGroup.visible = false;
        //  resetDeck
        this.resetDeck();
    }

    //  Deck Handling
    private resetDeck(): void {
      this.deck = []
      let suits = [ 'c', 's', 'h', 'd' ];

        for (let s = 0; s < suits.length; s++)
        {
            for (let i = 2; i <= 10; i++)
            {
                this.deck.push(new Card(suits[s], i, null));
            }

            this.deck.push(new Card(suits[s], 1, 'Ace'));
            this.deck.push(new Card(suits[s], 11, 'Jack'));
            this.deck.push(new Card(suits[s], 12, 'Queen'));
            this.deck.push(new Card(suits[s], 13, 'King'));
        }
        //  for(let i = 0; i < this.deck.length; i++) {
        //    console.log(this.deck[i].getSuit(), this.deck[i].getValue(), this.deck[i].getTexture());
        //  }
    }

    private getCardFromDeck(): Card {
      let index = this.rnd.between(0, this.deck.length - 1);
      let card = this.deck.splice(index, 1)[0];

      return card;
    }
    //  PlayGroup

    private clickPlay(): void {
      this.cardGroup.removeAll(true, true);

      this.startGroup.visible = false;
      this.resetDeck();

      this.hand = [];
      this.opponentHand = [];
      this.community = [];


      this.playerText.text += this.playerBank;
      this.currentStage = 0;
      this.stageController();


    }

    private stageController(): void {
      //  stage contoller
      switch (this.currentStage) {
        case STAGE.INITDEAL:
          this.initialDeal();
          break;
        case STAGE.BET:
          this.stageBet();
          break;
        case STAGE.FLOP:
          this.raisedAmount = 0;
          this.raise = false;
          this.stageFlop(0);
          break;
        case STAGE.RIVER:
          this.raisedAmount = 0;
          this.raise = false;
          this.stageRiver(0);
          break;
        case STAGE.TURN:
          this.raisedAmount = 0;
          this.raise = false;
          this.stageTurn(0);
          break;
        case STAGE.EVAL:
          this.stageEval();
          break;
        case STAGE.RESTARTROUND:
          this.stageRestart();
          break
        default:
          break;
      }
    }


    //  betGroup

    private clickBet(): void {
      this.removePlayerBank(this.bet);
      this.addToPot(this.bet);
      this.playerRaiseGroup.visible = false;
      this.statusText.visible = true;
      this.raise = true;
      this.raisedAmount = this.bet;
      this.oldBet = this.raisedAmount;
      this.betCount--;
      this.turn = OmahaHi.OPPONENT;

      this.stageBet();
    }

    private clickCallBet(): void{
      this.removePlayerBank(this.bet);
      this.addToPot(this.bet);
      this.updateStatusText('You called at $' + this.bet);
      this.turn = OmahaHi.OPPONENT;
      this.stageBet();
    }

    private clickFoldBet(): void {
      this.updateStatusText("You Folded.")
      this.opponentWins();

    }

    private clickRaiseBet(): void {
      console.log('Clicked Raise bet');
      this.playerRaiseGroup.visible = true;
      this.betGroup.visible = false;
      this.statusText.visible = false;
      // Update

    }

    private clickCheckBet(): void {

      this.turn = OmahaHi.OPPONENT;
      this.stageBet();
    }

    //  raiseGroup
    private clickUpRaise(): void {
      console.log('raised bet')
      this.bet = this.math.maxAdd(this.bet, 10, this.playerBank);
      this.raiseAmount.text = '$' + this.bet;
    }

    private clickDownRaise(): void {
      console.log('lowered bet')
      this.bet = this.math.minSub(this.bet, 10, 10);
      this.raiseAmount.text = '$' + this.bet;
    }

    //  stages
    private initialDeal(): void {
      this.playGroup.visible = true;
      // remove blind
      this.removePlayerBank(this.blind);
      this.removeOpponentBank(this.blind);
      this.updateStatusText('Blinds of $10 of been payed.');
      this.updateStatusText('Initial Deal');
      this.addToPot(this.blind*1.5)
      for(let i = 0; i < 3; i++){
        this.dealCardToPlayer(500*i, true);
        this.dealCardToOpponent(600*i, false);
      }
      this.dealCardToPlayer(2000, true)
      let tween = this.dealCardToOpponent(2400, false);

      this.currentStage = STAGE.BET;
      tween.onComplete.add(this.stageController, this);
    }

    private stageBet(): void {
      if(this.betCount === 2) {
        this.betGroup.visible = false;

        this.betCount = 0;
        if( this.community.length === 3){
          this.currentStage = STAGE.RIVER;
        } else if (this.community.length === 4) {
          this.currentStage = STAGE.TURN;
        } else {
          this.currentStage = STAGE.FLOP;
        }

        this.stageController();
        return
      }
      switch (this.turn) {
        case OmahaHi.PLAYER:
            this.betCount++;
            this.playerBetStage();
          break;
        case OmahaHi.OPPONENT:
            this.betCount++;
            this.opponentBetStage();
          break;
        default:
          return;
        }

    }
  private playerBetStage(): void {
    this.updateStatusText('Your bet.');
    this.raise = true;
    this.betGroup.visible = true;
    if(this.raise == true) {
      this.checkButton.visible = false;
    }
  }
  private opponentCheck() {
    this.updateStatusText('Opponent checked.' + this.raisedAmount);
    this.turn = OmahaHi.PLAYER;
    this.stageBet();
  }
  private opponentCall() {
    if(this.raisedAmount > 0) {
      this.removeOpponentBank(this.raisedAmount)
      this.addToPot(this.raisedAmount);
    }

    this.updateStatusText('Opponent called at $' + this.raisedAmount);
    this.turn = OmahaHi.PLAYER;
    this.stageBet();
  }

  private opponentRaiseBet(amount) {
    this.bet = amount;

    this.raisedAmount = this.oldBet - this.bet;
    if(this.raisedAmount <= 0){
      this.oldBet = this.bet;
      this.raisedAmount = this.bet;
    }
    this.raise = true;
    this.removeOpponentBank(this.bet);
    this.addToPot(this.bet);
    this.updateStatusText('Opponent raised at $' + this.raisedAmount);
    this.turn = OmahaHi.PLAYER;
    this.stageBet();
  }

  private oppontPreFlopBet(): void {
    let cards = this.opponentHand
    let cardVals = 0;
    for (let card of cards){
      cardVals += card.getValue();
    }

    if(cardVals >= 40) {
      let amount = this.math.roundTo(this.opponentBank*(cardVals/500),0);
      this.opponentRaiseBet(amount)
      return;
    }
    if(cardVals >= 20 && this.raise) {
      this.opponentCall();
      return;
    }

    this.opponentCheck();

  }
  private oppontPostFlopBet(): void {
    let cards = this.opponentHand
    let cardVals = 0;
    for (let card of cards){
      cardVals += card.getValue();
    }
    let amount = this.math.roundTo(this.opponentBank*(cardVals/500),0);
    this.opponentRaiseBet(amount)
  }
  private opponentBetStage(): void {

    switch(this.community.length) {
      case 0:
        this.oppontPreFlopBet();
        break;
      default:
        this.oppontPostFlopBet();
        break;
    }
  }

    private stageFlop(delay): void {
      this.updateStatusText('Dealing flop.')
      this.dealCardToCommunity(500);
      this.dealCardToCommunity(600);
      let tween = this.dealCardToCommunity(700);

      // Got Back to BET
      this.currentStage = STAGE.BET;
      tween.onComplete.add(this.stageController, this);

    }

    private stageRiver(delay): void {
      this.updateStatusText('Dealing River.');
      let tween = this.dealCardToCommunity(0);

      // Got Back to BET
      this.currentStage = STAGE.BET;
      tween.onComplete.add(this.stageController, this);
    }


    private stageTurn(delay): void {
      this.updateStatusText('Dealing Turn.');
      let tween = this.dealCardToCommunity(0);

      // Got Back to BET
      this.currentStage = STAGE.EVAL;
      tween.onComplete.add(this.stageController, this);
    }

    private stageEval(): void {

      let board = this.communityHandResults();
      let opponentResults = this.opponentHandResults();
      let playerResults = this.playerHandResults();

      let hand1 = {id: 1, cards: opponentResults};
      let hand2 = {id: 2, cards: playerResults};
      let hands = [hand1, hand2];
      let results = Ranker.orderHands(hands, board, Ranker.OMAHA_HI);

      if(results[0][0].id === 1 ) {
        this.updateStatusText('Opponent has won with a ' + results[0][0].description +'!');
        this.opponentWins();
      }
      if(results[0][0].id === 2) {
        this.updateStatusText('Player has won with a ' + results[0][0].description + '!');
        this.playerWins();
      }

    }
    private newRound(): void{
      this.cardGroup.removeAll(true, true);
      this.currentStage = STAGE.INITDEAL;
      this.stageController();

    }
    private stageRestart(): void {
      console.log('Restart Round');
      if(this.playerBank <= 0) {
        this.updateStatusText("YOU ARE BANKRUPT")
        this.updateStatusText("CLICK ANYWHERE TO BEGIN WITH $1000")
        this.input.onDown.addOnce(this.clickPlay, this);
        this.addPlayerBank(1000);
        return;
      }
      this.updateStatusText("Click for a new Round")
      this.input.onDown.addOnce(this.clickPlay, this);



    }
    //  utilities
    private updateStatusText(status): void {
      this.statusGroup.visible = false;
      this.statusText.text = this.oldStatusText + '\n' + status;
      this.statusGroup.visible = true;
      this.oldStatusText = status;
    }
    private removePlayerBank(amount): void {
      this.playerBank -= amount;
      //  Update GUI
      this.playerText.text = 'Stack: $' + this.playerBank;
      localStorage.setItem('playerBank', this.playerBank.toString());

    }

    private addPlayerBank(amount): void {
      this.playerBank += amount;

      // Update Gui
      this.playerText.text = 'Stack: $' + this.playerBank;
      localStorage.setItem('playerBank', this.playerBank.toString());

    }

    private playerWins(): void {
      this.flipOpponentCards();
      this.addPlayerBank(this.pot);
      this.removeFromPot(this.pot);

      this.currentStage = STAGE.RESTARTROUND;
      this.stageController();
    }

    private opponentWins(): void {
      this.flipOpponentCards();
      this.addOpponentBank(this.pot);
      this.removeFromPot(this.pot);

      this.currentStage = STAGE.RESTARTROUND;
      this.stageController();
    }
    private removeOpponentBank(amount): void {
      this.opponentBank -= amount;
      //  Update GUI
    }

    private addOpponentBank(amount): void {
      this.opponentBank += amount;

      // Update Gui
    }

    private playerHandResults() {
      let playerHand = [];
      let i = null;

      for(i = 0; i < this.hand.length; i++){
        playerHand.push(this.hand[i].getCardEvalObject());
      }

      return playerHand;
    }

    private opponentHandResults() {
      let ophand = [];
      let i = null;

      for(i = 0; i < this.opponentHand.length; i++){
        ophand.push(this.opponentHand[i].getCardEvalObject());
      }

      console.log(ophand);
      return ophand;

    }

    private communityHandResults() {
      let comhand = [];
      let i = null

      for(i = 0; i < this.community.length; i++) {
        comhand.push(this.community[i].getCardEvalObject())
      }

      return comhand;
    }

    private removeFromPot(amount): void {
        this.pot -= amount;
        this.potText.text = 'Pot ' + '$' + this.pot;
    }

    private addToPot(amount): void {
      this.pot += amount;
      this.potText.text = 'Pot ' + '$' + this.pot;
      //  Update GUI
    }

    private dealCardToCommunity(delay): Phaser.Tween {
      let card = this.getCardFromDeck();

      card.sprite = this.cardGroup.create(400, -200, 'cards_array', card.getTexture());
      card.sprite.bringToTop();

      let x = 150 + (this.community.length * 160);
      let y = 300;
      this.add.tween(card.sprite).to( {y: y}, 500, 'Sine.easeIn', true, delay);
      let tween = this.add.tween(card.sprite).to( {x: x}, 500, 'Sine.easeIn', true, delay + 250);

      this.community.push(card);
      return tween;
    }

    private dealCardToPlayer(delay, visible): Phaser.Tween {
      let card = this.getCardFromDeck();

      card.sprite = this.cardGroup.create(400, -200, 'cards_array', card.getTexture());
      card.sprite.bringToTop();

      let x = 32 + (this.hand.length * 80);
      let y = 560

      this.add.tween(card.sprite).to( { y: y }, 500, 'Sine.easeIn', true, delay);
      let tween = this.add.tween(card.sprite).to( { x: x }, 500, 'Sine.easeIn', true, delay + 250);

      this.hand.push(card);

      return tween;
    }

    private flipOpponentCards(): void{
      let cards = this.opponentHand;
      let x = 32;
      let y = 40;

      for(let card of cards) {

        card.sprite = this.cardGroup.create(400, -200, 'cards_array', card.getTexture());
        card.sprite.x = x;
        card.sprite.y = y;

        x += 80;
      }

    }

    private dealCardToOpponent(delay, visible): Phaser.Tween {
      let card = this.getCardFromDeck();
      let frame = (visible) ? card.getTexture() : 'back';

      card.sprite = this.cardGroup.create(400, -200, 'cards_array', frame)
      card.sprite.bringToTop();

      let x = 32 + (this.opponentHand.length * 80);
      let y = 40

      this.add.tween(card.sprite).to( { y: y }, 500, 'Sine.easeIn', true, delay);
      let tween = this.add.tween(card.sprite).to( { x: x }, 500, 'Sine.easeIn', true, delay + 250);

      this.opponentHand.push(card);

      return tween;
    }



}
