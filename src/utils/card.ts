class CardEvalObject {
  public rank = null;
  public suit = null;

  public constructor(suit, value){
    this.rank = value;
    this.suit = suit;
  }
}
export default class Card {
  private suit = null;
  private texture = null;
  private value = null;
  public sprite = null;

  //Creation Method for Cards
  public constructor(suit, value, texture){

    if (texture === null) { texture = value; }

    this.suit = suit;
    this.value = value;
    this.texture = suit + texture;

    //Return Card
  }

  public getSuit(): string{
    return this.suit;
  }

  public getValue(): number{
    return this.value;
  }

  public getTexture(): string{
    return this.texture;
  }

  public getCardEvalObject(): CardEvalObject{
    let value = this.value;
    let suit = this.suit;

    switch(this.value) {
      case 'Ace':
        value = 'A';
        break;
      case 'King':
        value = 'K';
        break;
      case 'Queen':
        value = 'Q';
        break;
      case 'Jack':
        value = 'J';
        break;
      case 13:
        value = 'K'
        break;
      case 12:
        value = 'Q'
        break;
      case 11:
        value = 'J'
        break;

      case 10:
        value = 'T';
        break;
      case 9:
        value = '9';
        break;
      case 8:
        value = '8';
        break;
      case 7:
        value = '7';
        break;
      case 6:
        value = '6';
        break;
      case 5:
        value = '5'
        break;
      case 4:
        value = '4';
        break;
      case 3:
        value = '3'
        break;
      case 2:
        value = '2';
        break;
      case 1:
        value = 'A';
        break;
      default:
        break;
      }

    return new CardEvalObject(this.suit, value);  }
}
