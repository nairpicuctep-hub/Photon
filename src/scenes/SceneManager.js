// SceneManager.js — owns the active scene and forwards update/render. Scenes
// implement optional enter()/exit() lifecycle hooks. (Boot/Menu/CampaignMap/
// Battle/Pause/Result come in later milestones; M1 ships only FeelSliceScene.)

export class SceneManager {
  constructor() { this.current = null; }

  set(scene) {
    if (this.current && this.current.exit) this.current.exit();
    this.current = scene;
    if (scene && scene.enter) scene.enter();
  }

  update(dt) { if (this.current && this.current.update) this.current.update(dt); }
  render(dt) { if (this.current && this.current.render) this.current.render(dt); }
}
