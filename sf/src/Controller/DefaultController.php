<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class DefaultController extends AbstractController
{
    #[Route('/', name: 'home')]
    public function index(): Response {

        return $this->render('index.html.twig', []);
    }

    #[Route('/modules/{moduleName}', name: 'modules')]
    public function modules(string $moduleName): Response {
        return $this->render(sprintf('modules/%s.wgsl', $moduleName), []);
    }

}
