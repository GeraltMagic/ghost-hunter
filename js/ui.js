// ============================================================
// Ghost Hunter — UI Click Handling
// ============================================================

const UI = {
  handleClick(mx, my, game) {
    switch (game.state) {
      case 'menu': this.handleMenuClick(mx, my, game); break;
      case 'location_select': this.handleLocationClick(mx, my, game); break;
      case 'investigating': this.handleInvestigationClick(mx, my, game); break;
      case 'training': this.handleTrainingClick(mx, my, game); break;
      case 'results': this.handleResultsClick(mx, my, game); break;
      case 'skills': this.handleSkillsClick(mx, my, game); break;
      case 'shop': this.handleShopClick(mx, my, game); break;
      case 'bestiary': this.handleBestiaryClick(mx, my, game); break;
    }
  },

  hitTest(mx, my, btn) {
    return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
  },

  handleMenuClick(mx, my, game) {
    const buttons = Renderer._menuButtons || [];
    for (const btn of buttons) {
      if (this.hitTest(mx, my, btn)) {
        switch (btn.action) {
          case 'training': game.goToTraining(); break;
          case 'location_select': game.goToLocationSelect(); break;
          case 'skills': game.goToSkills(); break;
          case 'shop': game.goToShop(); break;
          case 'bestiary': game.goToBestiary(); break;
          case 'delete_save':
            game.deleteSave();
            game.notify('Save data deleted.');
            break;
        }
        return;
      }
    }
  },

  handleLocationClick(mx, my, game) {
    // Back button
    if (Renderer._backBtn && this.hitTest(mx, my, Renderer._backBtn)) {
      game.goToMenu();
      return;
    }

    const buttons = Renderer._locationButtons || [];
    for (const btn of buttons) {
      if (this.hitTest(mx, my, btn)) {
        game.startInvestigation(btn.locationId);
        return;
      }
    }
  },

  handleInvestigationClick(mx, my, game) {
    // Ghost guess buttons (in journal)
    if (game.showJournal) {
      const buttons = Renderer._ghostGuessButtons || [];
      for (const btn of buttons) {
        if (this.hitTest(mx, my, btn)) {
          if (!game.captureAttempted) {
            game.attemptCapture(btn.ghostId);
          }
          return;
        }
      }
    }
  },

  handleTrainingClick(mx, my, game) {
    const step = TRAINING_STEPS[game.trainingStep];
    if (!step) return;

    // Continue/Finish button for dialog steps
    if (step.action === 'click_continue' || step.action === 'click_finish') {
      if (Renderer._trainingContinueBtn && this.hitTest(mx, my, Renderer._trainingContinueBtn)) {
        game.trainingClickContinue();
        return;
      }
    }

    // Ghost guess during the capture step
    if (step.action === 'attempt_capture' && game.showJournal) {
      const buttons = Renderer._ghostGuessButtons || [];
      for (const btn of buttons) {
        if (this.hitTest(mx, my, btn)) {
          game.trainingAttemptCapture(btn.ghostId);
          return;
        }
      }
    }
  },

  handleResultsClick(mx, my, game) {
    if (Renderer._continueBtn && this.hitTest(mx, my, Renderer._continueBtn)) {
      game.goToMenu();
    }
  },

  handleSkillsClick(mx, my, game) {
    if (Renderer._backBtn && this.hitTest(mx, my, Renderer._backBtn)) {
      game.goToMenu();
      return;
    }

    const buttons = Renderer._skillButtons || [];
    for (const btn of buttons) {
      if (this.hitTest(mx, my, btn) && btn.canUpgrade) {
        if (game.upgradeSkill(btn.skillId)) {
          game.notify(`${SKILLS[btn.skillId].name} upgraded!`);
        }
        return;
      }
    }
  },

  handleShopClick(mx, my, game) {
    if (Renderer._backBtn && this.hitTest(mx, my, Renderer._backBtn)) {
      game.goToMenu();
      return;
    }

    const buttons = Renderer._shopButtons || [];
    for (const btn of buttons) {
      if (this.hitTest(mx, my, btn) && btn.canBuy) {
        if (game.buyEquipment(btn.eqId)) {
          game.notify(`Purchased ${EQUIPMENT[btn.eqId].name}!`);
        }
        return;
      }
    }

    // Heal button
    if (Renderer._healBtn && this.hitTest(mx, my, Renderer._healBtn) && Renderer._healBtn.canHeal) {
      if (game.healPlayer()) {
        game.notify('Health restored!');
      }
    }
  },

  handleBestiaryClick(mx, my, game) {
    if (Renderer._backBtn && this.hitTest(mx, my, Renderer._backBtn)) {
      game.goToMenu();
    }
  },
};
