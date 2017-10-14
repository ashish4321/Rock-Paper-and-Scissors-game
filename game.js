var userChoice,
    computerChoice,
    win = "User wins!",
    lose = "Computer wins!",
    tie = "It's a tie";

$('.choice').click(function () {
  userChoice = $(this).data('value');

  computerChoice = Math.random();

  if (computerChoice < 0.34) {
    computerChoice = "rock";
  } else if(computerChoice <= 0.67) {
      computerChoice = "paper";
  } else {
      computerChoice = "scissors";
  }

  $('#userChoice').html('<i class="fa fa-hand-'+ userChoice +'-o bg-faded">');
  $('#computerChoice').html('<i class="fa fa-hand-'+ computerChoice +'-o bg-faded">');

  if (userChoice === computerChoice) {
    $('#result').text(tie);
  } else {
    switch (userChoice) {
      case "rock":
        if (computerChoice == "scissors") {
          $('#result').text(win);
        } else {
          $('#result').text(lose);
        }
        break;
      case "paper":
        if (computerChoice == "scissors") {
          $('#result').text(lose);
        } else {
          $('#result').text(win);
        }
        break;
      case "scissors":
        if (computerChoice == "paper") {
          $('#result').text(win);
        } else {
          $('#result').text(lose);
        }
    }
  }
}) 