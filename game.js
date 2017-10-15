var choices = ["rock", "paper", "scissors"];

function compare(user, computer) {
    var repeat = true;
    switch (user){
    case "rock":

      switch (computer){
          case "rock":
            repeat = confirm("Computer chose rock. It's a tie! Play again?");
            break;
          case "paper":
            repeat = confirm("Computer chose paper. Computer wins! Play again?");
            break;
          case "scissors":
            repeat = confirm("Computer chose scissors. You win! Play again?");
            break;
      }

      break;
    case "paper":

    switch (computer){
        case "rock":
          repeat = confirm("Computer chose rock. You win! Play again?");
          break;
        case "paper":
          repeat = confirm("Computer chose paper. It's a tie! Play again?");
          break;
        case "scissors":
          repeat = confirm("Computer chose scissors. Cowputer wins! Play again?");
          break;
    }

      break;
    case "scissors":

    switch (computer){
        case "rock":
          repeat = confirm("Computer chose rock. Computer wins! Play again?");
          break;
        case "paper":
          repeat = confirm("Computer chose paper. You win! Play again?");
          break;
        case "scissors":
          repeat = confirm("Computer chose scissors. It's a tie! Play again?");
          break;
    }

      break;
    default:
      repeat = confirm("Invalid input. Would you like to try again?");
    }
    return repeat;
}

function game() {
    var userChoice = prompt("Do you choose rock, paper or scissors?").toLowerCase();
    var computerChoice = choices[Math.floor(Math.random()*3)];
    console.log("Player :" + " " + userChoice);
    console.log("Computer :" + " " + computerChoice);

    if (compare(userChoice, computerChoice)) {
        game();
    }
}
game();